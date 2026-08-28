-- Adaptive retrieval practice. The reviewed corpus is imported as draft only;
-- answer keys and scheduling mutations remain server-side.

create table public.retrieval_items (
  id bigint generated always as identity primary key,
  stable_code text not null unique,
  topic_id bigint not null references public.topics (id) on delete cascade,
  prompt text not null,
  retrieval_type text not null,
  difficulty text not null,
  estimated_seconds integer not null,
  objective text not null,
  editorial_status text not null default 'draft',
  scheduler_version text not null default 'spacing-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retrieval_items_stable_code_format
    check (stable_code ~ '^C[0-9]{2}-(R|QC)[0-9]{2}$'),
  constraint retrieval_items_prompt_not_blank
    check (char_length(btrim(prompt)) > 0),
  constraint retrieval_items_type_allowed
    check (retrieval_type in ('free_recall', 'cued_recall', 'recognition')),
  constraint retrieval_items_difficulty_allowed
    check (difficulty in ('basic', 'intermediate', 'advanced')),
  constraint retrieval_items_estimated_seconds_valid
    check (estimated_seconds between 15 and 600),
  constraint retrieval_items_objective_not_blank
    check (char_length(btrim(objective)) > 0),
  constraint retrieval_items_status_allowed
    check (editorial_status in ('draft', 'review', 'published', 'withdrawn')),
  constraint retrieval_items_scheduler_version
    check (scheduler_version = 'spacing-v1')
);

create index retrieval_items_topic_status_idx
  on public.retrieval_items (topic_id, editorial_status, stable_code);

create trigger retrieval_items_set_updated_at
before update on public.retrieval_items
for each row execute function public.set_updated_at();

-- Deliberately placed in an RLS-locked table with no client policy. A future
-- reveal action must re-read it through the server-only administrative client.
create table public.retrieval_item_answer_keys (
  retrieval_item_id bigint primary key
    references public.retrieval_items (id) on delete cascade,
  required_points jsonb not null,
  acceptable_alternatives jsonb not null default '[]'::jsonb,
  common_errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint retrieval_keys_required_points_array
    check (jsonb_typeof(required_points) = 'array'
      and jsonb_array_length(required_points) > 0),
  constraint retrieval_keys_alternatives_array
    check (jsonb_typeof(acceptable_alternatives) = 'array'),
  constraint retrieval_keys_common_errors_array
    check (jsonb_typeof(common_errors) = 'array')
);

create table public.retrieval_item_evidence (
  id bigint generated always as identity primary key,
  retrieval_item_id bigint not null
    references public.retrieval_items (id) on delete cascade,
  evidence_code text not null,
  label text not null,
  href text,
  verified_on date,
  created_at timestamptz not null default now(),
  constraint retrieval_item_evidence_code_not_blank
    check (char_length(btrim(evidence_code)) > 0),
  constraint retrieval_item_evidence_label_not_blank
    check (char_length(btrim(label)) > 0),
  constraint retrieval_item_evidence_href_https
    check (href is null or href ~ '^https://'),
  constraint retrieval_item_evidence_unique
    unique (retrieval_item_id, evidence_code)
);

create index retrieval_item_evidence_item_idx
  on public.retrieval_item_evidence (retrieval_item_id);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active',
  target_size smallint not null,
  current_position smallint not null default 1,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint practice_sessions_status_allowed
    check (status in ('active', 'completed', 'abandoned')),
  constraint practice_sessions_target_size
    check (target_size between 3 and 5),
  constraint practice_sessions_current_position
    check (current_position between 1 and 32),
  constraint practice_sessions_completion_consistent
    check ((status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null))
);

create unique index practice_sessions_one_active_per_user_idx
  on public.practice_sessions (user_id) where status = 'active';
create index practice_sessions_user_activity_idx
  on public.practice_sessions (user_id, last_activity_at desc);

create table public.practice_session_items (
  session_id uuid not null
    references public.practice_sessions (id) on delete cascade,
  retrieval_item_id bigint not null
    references public.retrieval_items (id) on delete restrict,
  position smallint not null,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  primary key (session_id, position),
  constraint practice_session_items_position check (position between 1 and 32),
  constraint practice_session_items_status
    check (status in ('queued', 'revealed', 'rated'))
);

create table public.retrieval_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  session_position smallint not null,
  retrieval_item_id bigint not null
    references public.retrieval_items (id) on delete cascade,
  confidence text not null,
  outcome text,
  revealed_at timestamptz not null default now(),
  rated_at timestamptz,
  constraint retrieval_attempts_confidence_allowed
    check (confidence in ('sure', 'unsure', 'no_recall')),
  constraint retrieval_attempts_outcome_allowed
    check (outcome is null or outcome in ('incorrect', 'partial', 'correct')),
  constraint retrieval_attempts_session_position
    check (session_position between 1 and 32),
  constraint retrieval_attempts_rating_consistent
    check ((outcome is null and rated_at is null)
      or (outcome is not null and rated_at is not null)),
  constraint retrieval_attempts_single_reveal
    unique (session_id, session_position)
);

create index retrieval_attempts_user_item_idx
  on public.retrieval_attempts (user_id, retrieval_item_id, revealed_at desc);
create index retrieval_attempts_session_idx
  on public.retrieval_attempts (session_id, revealed_at);

create table public.retrieval_schedule_states (
  user_id uuid not null references auth.users (id) on delete cascade,
  retrieval_item_id bigint not null
    references public.retrieval_items (id) on delete cascade,
  stage smallint not null default 0,
  success_streak integer not null default 0,
  lapse_count integer not null default 0,
  last_confidence text,
  last_outcome text,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null,
  scheduler_version text not null default 'spacing-v1',
  updated_at timestamptz not null default now(),
  primary key (user_id, retrieval_item_id),
  constraint retrieval_schedule_stage_valid check (stage between 0 and 5),
  constraint retrieval_schedule_streak_valid check (success_streak >= 0),
  constraint retrieval_schedule_lapses_valid check (lapse_count >= 0),
  constraint retrieval_schedule_confidence_allowed
    check (last_confidence is null
      or last_confidence in ('sure', 'unsure', 'no_recall')),
  constraint retrieval_schedule_outcome_allowed
    check (last_outcome is null
      or last_outcome in ('incorrect', 'partial', 'correct')),
  constraint retrieval_schedule_version check (scheduler_version = 'spacing-v1')
);

create index retrieval_schedule_due_idx
  on public.retrieval_schedule_states (user_id, next_review_at, retrieval_item_id);

create trigger retrieval_schedule_states_set_updated_at
before update on public.retrieval_schedule_states
for each row execute function public.set_updated_at();

alter table public.retrieval_items enable row level security;
alter table public.retrieval_item_answer_keys enable row level security;
alter table public.retrieval_item_evidence enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_session_items enable row level security;
alter table public.retrieval_attempts enable row level security;
alter table public.retrieval_schedule_states enable row level security;

revoke all on table public.retrieval_items,
  public.retrieval_item_answer_keys,
  public.retrieval_item_evidence,
  public.practice_sessions,
  public.practice_session_items,
  public.retrieval_attempts,
  public.retrieval_schedule_states from public, anon, authenticated;
revoke all on sequence public.retrieval_items_id_seq,
  public.retrieval_item_evidence_id_seq
  from public, anon, authenticated;

grant select on public.retrieval_items,
  public.retrieval_item_evidence,
  public.practice_sessions,
  public.practice_session_items,
  public.retrieval_attempts,
  public.retrieval_schedule_states to authenticated;
grant select, insert, update, delete on public.retrieval_items,
  public.retrieval_item_answer_keys,
  public.retrieval_item_evidence,
  public.practice_sessions,
  public.practice_session_items,
  public.retrieval_attempts,
  public.retrieval_schedule_states to service_role;
grant usage, select on sequence public.retrieval_items_id_seq,
  public.retrieval_item_evidence_id_seq to service_role;

create policy retrieval_items_select_published_or_admin
on public.retrieval_items for select to authenticated
using (
  (select private.is_admin())
  or (
    editorial_status = 'published'
    and exists (
      select 1
      from public.topics
      join public.classes on classes.id = topics.class_id
      where topics.id = retrieval_items.topic_id
        and topics.approval_status = 'approved'
        and classes.publication_status = 'published'
    )
  )
);

-- No policy is intentionally defined on retrieval_item_answer_keys.

create policy retrieval_item_evidence_select_published_or_admin
on public.retrieval_item_evidence for select to authenticated
using (
  exists (
    select 1 from public.retrieval_items
    where retrieval_items.id = retrieval_item_evidence.retrieval_item_id
      and (
        (select private.is_admin())
        or (
          retrieval_items.editorial_status = 'published'
          and exists (
            select 1
            from public.topics
            join public.classes on classes.id = topics.class_id
            where topics.id = retrieval_items.topic_id
              and topics.approval_status = 'approved'
              and classes.publication_status = 'published'
          )
        )
      )
  )
);

create policy practice_sessions_select_own
on public.practice_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy practice_session_items_select_own
on public.practice_session_items for select to authenticated
using (
  exists (
    select 1 from public.practice_sessions
    where practice_sessions.id = practice_session_items.session_id
      and practice_sessions.user_id = (select auth.uid())
  )
);

create policy retrieval_attempts_select_own
on public.retrieval_attempts for select to authenticated
using ((select auth.uid()) = user_id);

create policy retrieval_schedule_states_select_own
on public.retrieval_schedule_states for select to authenticated
using ((select auth.uid()) = user_id);

create function public.enqueue_retrieval_retry_v1(
  p_session_id uuid,
  p_user_id uuid,
  p_retrieval_item_id bigint,
  p_after_position smallint
)
returns smallint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  insertion_position smallint;
  last_position smallint;
  queued_position record;
begin
  perform 1
    from public.practice_sessions
   where id = p_session_id
     and user_id = p_user_id
     and status = 'active'
   for update;
  if not found then
    raise exception 'La sesión adaptativa no está activa.' using errcode = '42501';
  end if;

  select coalesce(max(position), 0)::smallint
    into last_position
    from public.practice_session_items
   where session_id = p_session_id;
  if last_position >= 32 then
    raise exception 'La sesión alcanzó el límite seguro de reintentos.'
      using errcode = '22023';
  end if;

  insertion_position := least((p_after_position + 3)::smallint, last_position + 1);
  for queued_position in
    select position
      from public.practice_session_items
     where session_id = p_session_id
       and position >= insertion_position
     order by position desc
  loop
    update public.practice_session_items
       set position = queued_position.position + 1
     where session_id = p_session_id
       and position = queued_position.position;
  end loop;

  insert into public.practice_session_items (
    session_id, retrieval_item_id, position
  ) values (
    p_session_id, p_retrieval_item_id, insertion_position
  );
  return insertion_position;
end;
$$;

revoke all on function public.enqueue_retrieval_retry_v1(uuid, uuid, bigint, smallint)
  from public, anon, authenticated;
grant execute on function public.enqueue_retrieval_retry_v1(uuid, uuid, bigint, smallint)
  to service_role;

create function public.import_retrieval_corpus_v1(p_corpus jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  evidence_entry jsonb;
  resolved_topic_id bigint;
  inserted_item_id bigint;
  imported_count integer := 0;
begin
  if jsonb_typeof(p_corpus) <> 'object'
     or p_corpus ->> 'schemaVersion' <> 'retrieval-corpus-v1'
     or p_corpus ->> 'approvalStatus' <> 'approved'
     or jsonb_typeof(p_corpus -> 'items') <> 'array'
     or jsonb_array_length(p_corpus -> 'items') = 0 then
    raise exception 'El corpus adaptativo no está aprobado o no cumple retrieval-corpus-v1.'
      using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_corpus -> 'items') loop
    if jsonb_typeof(item -> 'answerKey' -> 'evidence') <> 'array'
       or jsonb_array_length(item -> 'answerKey' -> 'evidence') = 0 then
      raise exception '% no contiene evidencia importable.', item ->> 'stableCode'
        using errcode = '23514';
    end if;

    select topics.id
      into resolved_topic_id
      from public.classes
      join public.topics on topics.class_id = classes.id
     where classes.curriculum_code = item ->> 'classCode'
       and topics.position = (item ->> 'topicPosition')::integer;

    if resolved_topic_id is null then
      raise exception 'No se encontró el tema de %.', item ->> 'stableCode'
        using errcode = '23503';
    end if;

    insert into public.retrieval_items (
      stable_code, topic_id, prompt, retrieval_type, difficulty,
      estimated_seconds, objective, editorial_status
    ) values (
      item ->> 'stableCode',
      resolved_topic_id,
      item ->> 'prompt',
      item ->> 'retrievalType',
      item ->> 'difficulty',
      (item ->> 'estimatedSeconds')::integer,
      item ->> 'objective',
      'draft'
    ) returning id into inserted_item_id;

    insert into public.retrieval_item_answer_keys (
      retrieval_item_id, required_points, acceptable_alternatives,
      common_errors
    ) values (
      inserted_item_id,
      item -> 'answerKey' -> 'requiredPoints',
      item -> 'answerKey' -> 'acceptableAlternatives',
      item -> 'answerKey' -> 'commonErrors'
    );

    for evidence_entry in
      select value
      from jsonb_array_elements(item -> 'answerKey' -> 'evidence')
    loop
      insert into public.retrieval_item_evidence (
        retrieval_item_id, evidence_code, label, href, verified_on
      ) values (
        inserted_item_id,
        evidence_entry ->> 'code',
        evidence_entry ->> 'label',
        nullif(evidence_entry ->> 'href', ''),
        nullif(evidence_entry ->> 'verifiedOn', '')::date
      );
    end loop;

    imported_count := imported_count + 1;
  end loop;

  return imported_count;
end;
$$;

revoke all on function public.import_retrieval_corpus_v1(jsonb)
  from public, anon, authenticated;
grant execute on function public.import_retrieval_corpus_v1(jsonb)
  to service_role;
