-- Editorial learning platform: authenticated students, publishable lessons,
-- versioned materials, study tools, and user-owned progress.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.classes
  add column publication_status text not null default 'draft',
  add column published_at timestamptz,
  add constraint classes_publication_status_allowed
    check (publication_status in ('draft', 'review', 'published')),
  add constraint classes_published_at_consistent
    check (
      (publication_status = 'published' and published_at is not null)
      or publication_status <> 'published'
    );

create index classes_publication_status_idx
  on public.classes (publication_status, published_at desc);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length
    check (full_name is null or char_length(full_name) <= 120),
  constraint profiles_role_allowed check (role in ('admin', 'student'))
);

create table public.study_materials (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  material_type text not null,
  title text not null,
  content text not null,
  source_origin text not null default 'mixed',
  source_transcript_id bigint references public.transcripts (id) on delete set null,
  generation_version text not null default 'editorial-v1',
  version integer not null default 1,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_materials_type_allowed check (
    material_type in (
      'short_answer',
      'full_explanation',
      'legal_basis',
      'simple_example',
      'ceneval_example',
      'summary',
      'study_guide',
      'key_concepts',
      'common_errors'
    )
  ),
  constraint study_materials_source_allowed
    check (source_origin in ('class', 'complementary', 'mixed')),
  constraint study_materials_title_not_blank
    check (char_length(btrim(title)) > 0),
  constraint study_materials_content_not_blank
    check (char_length(btrim(content)) > 0),
  constraint study_materials_version_positive check (version > 0)
);

create index study_materials_topic_id_idx
  on public.study_materials (topic_id);
create index study_materials_source_transcript_id_idx
  on public.study_materials (source_transcript_id);
create unique index study_materials_current_type_idx
  on public.study_materials (topic_id, material_type)
  where is_current;

create table public.legal_references (
  id bigint generated always as identity primary key,
  title text not null,
  url text not null,
  institution text not null,
  jurisdiction text not null,
  citation text not null default '',
  retrieved_on date not null,
  created_at timestamptz not null default now(),
  constraint legal_references_title_not_blank
    check (char_length(btrim(title)) > 0),
  constraint legal_references_url_https check (url ~ '^https://'),
  constraint legal_references_institution_not_blank
    check (char_length(btrim(institution)) > 0),
  constraint legal_references_jurisdiction_not_blank
    check (char_length(btrim(jurisdiction)) > 0)
);

create unique index legal_references_url_citation_idx
  on public.legal_references (url, citation);

create table public.topic_references (
  topic_id bigint not null references public.topics (id) on delete cascade,
  reference_id bigint not null
    references public.legal_references (id) on delete cascade,
  note text,
  primary key (topic_id, reference_id)
);

create index topic_references_reference_id_idx
  on public.topic_references (reference_id);

create table public.concept_maps (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  title text not null,
  description text,
  nodes jsonb not null,
  version integer not null default 1,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concept_maps_title_not_blank
    check (char_length(btrim(title)) > 0),
  constraint concept_maps_nodes_array
    check (jsonb_typeof(nodes) = 'array'),
  constraint concept_maps_version_positive check (version > 0)
);

create index concept_maps_topic_id_idx on public.concept_maps (topic_id);
create unique index concept_maps_current_topic_idx
  on public.concept_maps (topic_id)
  where is_current;

create table public.flashcards (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  question text not null,
  answer text not null,
  position integer not null,
  source_origin text not null default 'mixed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flashcards_question_not_blank
    check (char_length(btrim(question)) > 0),
  constraint flashcards_answer_not_blank
    check (char_length(btrim(answer)) > 0),
  constraint flashcards_position_positive check (position > 0),
  constraint flashcards_source_allowed
    check (source_origin in ('class', 'complementary', 'mixed')),
  constraint flashcards_topic_position_unique unique (topic_id, position)
);

create index flashcards_topic_id_idx on public.flashcards (topic_id);

create table public.flashcard_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  flashcard_id bigint not null
    references public.flashcards (id) on delete cascade,
  rating text not null,
  reviewed_at timestamptz not null default now(),
  next_review_at timestamptz,
  constraint flashcard_reviews_rating_allowed
    check (rating in ('again', 'hard', 'good', 'easy'))
);

create index flashcard_reviews_user_card_idx
  on public.flashcard_reviews (user_id, flashcard_id, reviewed_at desc);
create index flashcard_reviews_flashcard_id_idx
  on public.flashcard_reviews (flashcard_id);
create index flashcard_reviews_due_idx
  on public.flashcard_reviews (user_id, next_review_at);

create table public.exams (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  title text not null,
  description text,
  version integer not null default 1,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exams_title_not_blank check (char_length(btrim(title)) > 0),
  constraint exams_version_positive check (version > 0)
);

create index exams_topic_id_idx on public.exams (topic_id);
create unique index exams_current_topic_idx
  on public.exams (topic_id)
  where is_current;

create table public.exam_questions (
  id bigint generated always as identity primary key,
  exam_id bigint not null references public.exams (id) on delete cascade,
  question_text text not null,
  difficulty text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint exam_questions_text_not_blank
    check (char_length(btrim(question_text)) > 0),
  constraint exam_questions_difficulty_allowed
    check (difficulty in ('basic', 'intermediate', 'advanced')),
  constraint exam_questions_position_positive check (position > 0),
  constraint exam_questions_exam_position_unique unique (exam_id, position)
);

create index exam_questions_exam_id_idx on public.exam_questions (exam_id);

create table public.exam_options (
  id bigint generated always as identity primary key,
  question_id bigint not null
    references public.exam_questions (id) on delete cascade,
  option_text text not null,
  position integer not null,
  constraint exam_options_text_not_blank
    check (char_length(btrim(option_text)) > 0),
  constraint exam_options_position_positive check (position > 0),
  constraint exam_options_question_position_unique
    unique (question_id, position)
);

create index exam_options_question_id_idx
  on public.exam_options (question_id);

-- Correct answers are intentionally isolated from student-readable options.
create table public.exam_answer_keys (
  question_id bigint primary key
    references public.exam_questions (id) on delete cascade,
  correct_option_id bigint not null
    references public.exam_options (id) on delete cascade,
  explanation text not null,
  option_explanations jsonb not null default '{}'::jsonb,
  constraint exam_answer_keys_explanation_not_blank
    check (char_length(btrim(explanation)) > 0),
  constraint exam_answer_keys_option_explanations_object
    check (jsonb_typeof(option_explanations) = 'object')
);

create index exam_answer_keys_correct_option_id_idx
  on public.exam_answer_keys (correct_option_id);

create table public.exam_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id bigint not null references public.exams (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  total_questions integer,
  constraint exam_attempts_score_valid check (
    score is null
    or (score >= 0 and total_questions is not null and score <= total_questions)
  )
);

create index exam_attempts_user_exam_idx
  on public.exam_attempts (user_id, exam_id, started_at desc);
create index exam_attempts_exam_id_idx
  on public.exam_attempts (exam_id);

create table public.exam_answers (
  id bigint generated always as identity primary key,
  attempt_id bigint not null
    references public.exam_attempts (id) on delete cascade,
  question_id bigint not null
    references public.exam_questions (id) on delete cascade,
  selected_option_id bigint not null
    references public.exam_options (id) on delete cascade,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  constraint exam_answers_attempt_question_unique
    unique (attempt_id, question_id)
);

create index exam_answers_attempt_id_idx
  on public.exam_answers (attempt_id);
create index exam_answers_question_id_idx
  on public.exam_answers (question_id);
create index exam_answers_selected_option_id_idx
  on public.exam_answers (selected_option_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger study_materials_set_updated_at
before update on public.study_materials
for each row execute function public.set_updated_at();
create trigger concept_maps_set_updated_at
before update on public.concept_maps
for each row execute function public.set_updated_at();
create trigger flashcards_set_updated_at
before update on public.flashcards
for each row execute function public.set_updated_at();
create trigger exams_set_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.study_materials enable row level security;
alter table public.legal_references enable row level security;
alter table public.topic_references enable row level security;
alter table public.concept_maps enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_options enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.exam_answer_keys enable row level security;

grant select on public.subjects, public.classes, public.transcripts,
  public.topics, public.study_materials, public.legal_references,
  public.topic_references, public.concept_maps, public.flashcards,
  public.exams, public.exam_questions, public.exam_options
  to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.flashcard_reviews to authenticated;
grant select on public.exam_attempts, public.exam_answers to authenticated;

grant select, insert, update, delete on public.profiles,
  public.study_materials, public.legal_references, public.topic_references,
  public.concept_maps, public.flashcards, public.flashcard_reviews,
  public.exams, public.exam_questions, public.exam_options,
  public.exam_answer_keys, public.exam_attempts, public.exam_answers
  to service_role;
grant usage, select on all sequences in schema public to service_role;

create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_admin()));

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'student');

drop policy if exists subjects_select_authenticated on public.subjects;
create policy subjects_select_published_or_admin
on public.subjects for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.classes
    where classes.subject_id = subjects.id
      and classes.publication_status = 'published'
  )
);

create policy classes_select_published_or_admin
on public.classes for select to authenticated
using (
  publication_status = 'published'
  or (select private.is_admin())
);

create policy transcripts_select_published_or_admin
on public.transcripts for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.classes
    where classes.id = transcripts.class_id
      and classes.publication_status = 'published'
  )
);

create policy topics_select_published_or_admin
on public.topics for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.classes
    where classes.id = topics.class_id
      and classes.publication_status = 'published'
  )
);

create policy study_materials_select_published_or_admin
on public.study_materials for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = study_materials.topic_id
      and classes.publication_status = 'published'
      and study_materials.is_current
  )
);

create policy references_select_published_or_admin
on public.legal_references for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topic_references
    join public.topics on topics.id = topic_references.topic_id
    join public.classes on classes.id = topics.class_id
    where topic_references.reference_id = legal_references.id
      and classes.publication_status = 'published'
  )
);

create policy topic_references_select_published_or_admin
on public.topic_references for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = topic_references.topic_id
      and classes.publication_status = 'published'
  )
);

create policy concept_maps_select_published_or_admin
on public.concept_maps for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = concept_maps.topic_id
      and classes.publication_status = 'published'
      and concept_maps.is_current
  )
);

create policy flashcards_select_published_or_admin
on public.flashcards for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = flashcards.topic_id
      and classes.publication_status = 'published'
  )
);

create policy flashcard_reviews_select_own
on public.flashcard_reviews for select to authenticated
using ((select auth.uid()) = user_id);
create policy flashcard_reviews_insert_own
on public.flashcard_reviews for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy exams_select_published_or_admin
on public.exams for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = exams.topic_id
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

create policy exam_questions_select_published_or_admin
on public.exam_questions for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.exams
    join public.topics on topics.id = exams.topic_id
    join public.classes on classes.id = topics.class_id
    where exams.id = exam_questions.exam_id
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

create policy exam_options_select_published_or_admin
on public.exam_options for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.exam_questions
    join public.exams on exams.id = exam_questions.exam_id
    join public.topics on topics.id = exams.topic_id
    join public.classes on classes.id = topics.class_id
    where exam_questions.id = exam_options.question_id
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

create policy exam_attempts_select_own
on public.exam_attempts for select to authenticated
using ((select auth.uid()) = user_id);
create policy exam_answers_select_own
on public.exam_answers for select to authenticated
using (
  exists (
    select 1 from public.exam_attempts
    where exam_attempts.id = exam_answers.attempt_id
      and exam_attempts.user_id = (select auth.uid())
  )
);
