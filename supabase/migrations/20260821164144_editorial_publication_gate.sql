begin;

alter table public.classes
  add column content_version bigint not null default 1,
  add column content_digest text not null default '';

update public.classes
set content_digest = md5(
  id::text || ':' || content_version::text || ':' || clock_timestamp()::text
);

alter table public.classes alter column content_digest
  set default md5(random()::text || ':' || clock_timestamp()::text);

alter table public.classes
  add constraint classes_content_version_positive check (content_version > 0),
  add constraint classes_content_digest_present
    check (char_length(content_digest) = 32);

create table public.class_editorial_reviews (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.classes (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  verdict text not null,
  notes text,
  content_version bigint not null,
  content_digest text not null,
  legal_verified_on date,
  invalidated_at timestamptz,
  invalidation_reason text,
  constraint class_editorial_reviews_verdict_allowed
    check (verdict in ('approved', 'rejected')),
  constraint class_editorial_reviews_notes_length
    check (notes is null or char_length(notes) <= 2000),
  constraint class_editorial_reviews_version_positive
    check (content_version > 0),
  constraint class_editorial_reviews_digest_present
    check (char_length(content_digest) = 32),
  constraint class_editorial_reviews_approval_requires_legal_date
    check (verdict <> 'approved' or legal_verified_on is not null),
  constraint class_editorial_reviews_legal_date_not_future
    check (legal_verified_on is null or legal_verified_on <= current_date),
  constraint class_editorial_reviews_invalidation_consistent
    check (
      (invalidated_at is null and invalidation_reason is null)
      or (invalidated_at is not null and invalidation_reason is not null)
    )
);

create index class_editorial_reviews_class_latest_idx
  on public.class_editorial_reviews (class_id, reviewed_at desc);

create unique index class_editorial_reviews_one_current_approval_idx
  on public.class_editorial_reviews (class_id)
  where verdict = 'approved' and invalidated_at is null;

alter table public.class_editorial_reviews enable row level security;
revoke all on table public.class_editorial_reviews from anon, authenticated;
grant select (class_id, reviewed_at, legal_verified_on)
  on public.class_editorial_reviews to authenticated;
grant select, insert, update, delete
  on public.class_editorial_reviews to service_role;
grant usage, select on sequence public.class_editorial_reviews_id_seq
  to service_role;

create function private.validate_class_editorial_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_status text;
  current_version bigint;
  current_digest text;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = new.reviewer_id
      and profiles.role = 'admin'
  ) then
    raise exception 'La revisión debe pertenecer a una administradora.'
      using errcode = '23514';
  end if;

  select publication_status, content_version, content_digest
  into current_status, current_version, current_digest
  from public.classes
  where id = new.class_id
  for update;

  if current_status is null then
    raise exception 'La clase revisada no existe.' using errcode = '23503';
  end if;
  if current_status <> 'review' then
    raise exception 'La clase debe estar en revisión para emitir un dictamen.'
      using errcode = '23514';
  end if;
  if new.content_version <> current_version
     or new.content_digest <> current_digest then
    raise exception 'El dictamen no coincide con la versión actual del contenido.'
      using errcode = '23514';
  end if;

  if new.verdict = 'rejected' then
    update public.class_editorial_reviews
    set invalidated_at = coalesce(invalidated_at, now()),
        invalidation_reason = coalesce(
          invalidation_reason,
          'Un dictamen posterior rechazó esta versión.'
        )
    where class_id = new.class_id
      and content_version = new.content_version
      and content_digest = new.content_digest
      and verdict = 'approved'
      and invalidated_at is null;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_class_editorial_review()
  from public, anon, authenticated;

create trigger class_editorial_reviews_validate_insert
before insert on public.class_editorial_reviews
for each row execute function private.validate_class_editorial_review();

create policy class_editorial_reviews_select_published_verification
on public.class_editorial_reviews for select to authenticated
using (
  (select private.is_admin())
  or (
    verdict = 'approved'
    and invalidated_at is null
    and content_version = (
      select classes.content_version
      from public.classes
      where classes.id = class_editorial_reviews.class_id
        and classes.publication_status = 'published'
    )
    and content_digest = (
      select classes.content_digest
      from public.classes
      where classes.id = class_editorial_reviews.class_id
        and classes.publication_status = 'published'
    )
  )
);

create function private.touch_class_editorial_content(
  p_class_id bigint,
  p_reason text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_version bigint;
begin
  update public.classes
  set content_version = content_version + 1,
      content_digest = md5(
        id::text || ':' || (content_version + 1)::text || ':' ||
        clock_timestamp()::text || ':' || random()::text
      )
  where id = p_class_id
  returning content_version into next_version;

  if next_version is not null then
    update public.class_editorial_reviews
    set invalidated_at = coalesce(invalidated_at, now()),
        invalidation_reason = coalesce(invalidation_reason, p_reason)
    where class_id = p_class_id
      and invalidated_at is null;
  end if;
end;
$$;

revoke all on function private.touch_class_editorial_content(bigint, text)
  from public, anon, authenticated;
grant execute on function private.touch_class_editorial_content(bigint, text)
  to service_role;

create function private.invalidate_class_review_from_child()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_class_id bigint;
  affected_topic_id bigint;
  affected_exam_id bigint;
  affected_question_id bigint;
  affected_reference_id bigint;
begin
  if tg_argv[0] = 'class' then
    affected_class_id := coalesce(new.class_id, old.class_id);
  elsif tg_argv[0] = 'topic' then
    affected_topic_id := coalesce(new.topic_id, old.topic_id);
    select class_id into affected_class_id
    from public.topics where id = affected_topic_id;
  elsif tg_argv[0] = 'exam' then
    affected_exam_id := coalesce(new.exam_id, old.exam_id);
    select topics.class_id into affected_class_id
    from public.exams
    join public.topics on topics.id = exams.topic_id
    where exams.id = affected_exam_id;
  elsif tg_argv[0] = 'question' then
    affected_question_id := coalesce(new.question_id, old.question_id);
    select topics.class_id into affected_class_id
    from public.exam_questions
    join public.exams on exams.id = exam_questions.exam_id
    join public.topics on topics.id = exams.topic_id
    where exam_questions.id = affected_question_id;
  elsif tg_argv[0] = 'reference' then
    affected_reference_id := coalesce(new.id, old.id);
    for affected_class_id in
      select distinct topics.class_id
      from public.topic_references
      join public.topics on topics.id = topic_references.topic_id
      where topic_references.reference_id = affected_reference_id
    loop
      perform private.touch_class_editorial_content(
        affected_class_id,
        'Cambió una fuente jurídica vinculada.'
      );
    end loop;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if affected_class_id is not null then
    perform private.touch_class_editorial_content(
      affected_class_id,
      'Cambió el contenido editorial de la clase.'
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.invalidate_class_review_from_child()
  from public, anon, authenticated;

create function private.invalidate_class_review_from_class()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if row(
    new.title, new.class_date, new.teacher, new.description,
    new.curriculum_code, new.curriculum_order
  ) is distinct from row(
    old.title, old.class_date, old.teacher, old.description,
    old.curriculum_code, old.curriculum_order
  ) then
    new.content_version := old.content_version + 1;
    new.content_digest := md5(
      new.id::text || ':' || new.content_version::text || ':' ||
      clock_timestamp()::text || ':' || random()::text
    );
    update public.class_editorial_reviews
    set invalidated_at = coalesce(invalidated_at, now()),
        invalidation_reason = coalesce(
          invalidation_reason,
          'Cambió la ficha editorial de la clase.'
        )
    where class_id = new.id and invalidated_at is null;
  end if;
  return new;
end;
$$;

revoke all on function private.invalidate_class_review_from_class()
  from public, anon, authenticated;

create trigger classes_invalidate_editorial_review
before update on public.classes
for each row execute function private.invalidate_class_review_from_class();

create trigger transcripts_invalidate_editorial_review
after insert or update or delete on public.transcripts
for each row execute function private.invalidate_class_review_from_child('class');
create trigger topics_invalidate_editorial_review
after insert or update or delete on public.topics
for each row execute function private.invalidate_class_review_from_child('class');
create trigger class_audio_sources_invalidate_editorial_review
after insert or update or delete on public.class_audio_sources
for each row execute function private.invalidate_class_review_from_child('class');
create trigger study_materials_invalidate_editorial_review
after insert or update or delete on public.study_materials
for each row execute function private.invalidate_class_review_from_child('topic');
create trigger concept_maps_invalidate_editorial_review
after insert or update or delete on public.concept_maps
for each row execute function private.invalidate_class_review_from_child('topic');
create trigger flashcards_invalidate_editorial_review
after insert or update or delete on public.flashcards
for each row execute function private.invalidate_class_review_from_child('topic');
create trigger topic_references_invalidate_editorial_review
after insert or update or delete on public.topic_references
for each row execute function private.invalidate_class_review_from_child('topic');
create trigger legal_references_invalidate_editorial_review
after update on public.legal_references
for each row execute function private.invalidate_class_review_from_child('reference');
create trigger exams_invalidate_editorial_review
after insert or update or delete on public.exams
for each row execute function private.invalidate_class_review_from_child('topic');
create trigger exam_questions_invalidate_editorial_review
after insert or update or delete on public.exam_questions
for each row execute function private.invalidate_class_review_from_child('exam');
create trigger exam_options_invalidate_editorial_review
after insert or update or delete on public.exam_options
for each row execute function private.invalidate_class_review_from_child('question');
create trigger exam_answer_keys_invalidate_editorial_review
after insert or update or delete on public.exam_answer_keys
for each row execute function private.invalidate_class_review_from_child('question');

create function private.enforce_class_publication_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.publication_status = 'published'
     and old.publication_status is distinct from 'published' then
    if old.publication_status <> 'review' then
      raise exception 'La publicación requiere pasar primero por revisión.'
        using errcode = '23514';
    end if;

    if not exists (select 1 from public.topics where class_id = new.id) then
      raise exception 'La clase no tiene temas.' using errcode = '23514';
    end if;

    if exists (
      select 1 from public.topics
      where class_id = new.id and approval_status <> 'approved'
    ) then
      raise exception 'Todos los temas deben estar aprobados.'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.topics topic
      where topic.class_id = new.id
        and (
          (select count(distinct material_type)
           from public.study_materials
           where topic_id = topic.id and is_current) <> 9
          or (select count(*) from public.concept_maps
              where topic_id = topic.id and is_current) <> 1
          or (select count(*) from public.flashcards
              where topic_id = topic.id) < 10
          or (select count(*)
              from public.exam_questions
              join public.exams on exams.id = exam_questions.exam_id
              where exams.topic_id = topic.id and exams.is_current) <> 10
        )
    ) then
      raise exception 'Hay temas con materiales incompletos.'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.class_editorial_reviews review
      where review.class_id = new.id
        and review.verdict = 'approved'
        and review.invalidated_at is null
        and review.legal_verified_on is not null
        and review.content_version = new.content_version
        and review.content_digest = new.content_digest
    ) then
      raise exception 'Falta una revisión editorial vigente para esta versión.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_class_publication_gate()
  from public, anon, authenticated;

create trigger classes_enforce_publication_gate
before update of publication_status on public.classes
for each row execute function private.enforce_class_publication_gate();

drop policy if exists transcripts_select_published_or_admin
  on public.transcripts;
create policy transcripts_select_admin_only
on public.transcripts for select to authenticated
using ((select private.is_admin()));

commit;
