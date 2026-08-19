-- Initial academic schema for CENEVAL Study App.
-- Access remains server-only until authentication and per-user policies exist.

create table public.subjects (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_name_not_blank check (char_length(btrim(name)) > 0),
  constraint subjects_name_length check (char_length(name) <= 80),
  constraint subjects_description_length
    check (description is null or char_length(description) <= 300)
);

create unique index subjects_normalized_name_idx
  on public.subjects (lower(btrim(name)));

create table public.classes (
  id bigint generated always as identity primary key,
  subject_id bigint not null
    references public.subjects (id) on delete cascade,
  title text not null,
  class_date date,
  teacher text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_title_not_blank check (char_length(btrim(title)) > 0),
  constraint classes_title_length check (char_length(title) <= 120),
  constraint classes_teacher_length
    check (teacher is null or char_length(teacher) <= 100),
  constraint classes_description_length
    check (description is null or char_length(description) <= 400)
);

create index classes_subject_id_idx on public.classes (subject_id);
create index classes_subject_date_idx
  on public.classes (subject_id, class_date desc nulls last);

create table public.transcripts (
  id bigint generated always as identity primary key,
  class_id bigint not null unique
    references public.classes (id) on delete cascade,
  original_text text not null,
  cleaned_text text,
  processing_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcripts_original_minimum
    check (char_length(btrim(original_text)) >= 30),
  constraint transcripts_original_maximum
    check (char_length(original_text) <= 50000),
  constraint transcripts_cleaned_maximum
    check (cleaned_text is null or char_length(cleaned_text) <= 50000),
  constraint transcripts_processing_status_allowed
    check (
      processing_status in ('pending', 'processing', 'ready', 'failed')
    )
);

create table public.topics (
  id bigint generated always as identity primary key,
  class_id bigint not null
    references public.classes (id) on delete cascade,
  title text not null,
  description text,
  position integer not null,
  source_type text not null default 'manual',
  approval_status text not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_title_not_blank check (char_length(btrim(title)) > 0),
  constraint topics_title_length check (char_length(title) <= 120),
  constraint topics_description_length
    check (description is null or char_length(description) <= 400),
  constraint topics_position_positive check (position > 0),
  constraint topics_source_type_allowed
    check (source_type in ('manual', 'generated')),
  constraint topics_approval_status_allowed
    check (approval_status in ('pending', 'approved', 'rejected')),
  constraint topics_class_position_unique unique (class_id, position)
);

create index topics_class_id_idx on public.topics (class_id);
create index topics_class_approval_idx
  on public.topics (class_id, approval_status);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger transcripts_set_updated_at
before update on public.transcripts
for each row execute function public.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.transcripts enable row level security;
alter table public.topics enable row level security;

revoke all on table public.subjects from anon, authenticated;
revoke all on table public.classes from anon, authenticated;
revoke all on table public.transcripts from anon, authenticated;
revoke all on table public.topics from anon, authenticated;

grant select, insert, update, delete
  on table public.subjects, public.classes, public.transcripts, public.topics
  to service_role;

grant usage, select
  on sequence public.subjects_id_seq,
              public.classes_id_seq,
              public.transcripts_id_seq,
              public.topics_id_seq
  to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
