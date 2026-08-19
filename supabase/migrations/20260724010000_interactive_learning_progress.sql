-- Private, student-owned state for short interactive study sessions.

create table public.study_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id bigint not null references public.topics (id) on delete cascade,
  current_step text not null default 'discover',
  material_index integer not null default 0,
  session_minutes integer not null default 10,
  completed_steps text[] not null default '{}',
  last_activity_at timestamptz not null default now(),
  primary key (user_id, topic_id),
  constraint study_progress_step_allowed check (
    current_step in ('discover', 'understand', 'apply', 'remember', 'check')
  ),
  constraint study_progress_material_index_valid check (material_index >= 0),
  constraint study_progress_session_minutes_allowed
    check (session_minutes in (5, 10, 15))
);

create index study_progress_user_activity_idx
  on public.study_progress (user_id, last_activity_at desc);
create index study_progress_topic_id_idx on public.study_progress (topic_id);

create table public.quick_check_responses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id bigint not null references public.topics (id) on delete cascade,
  prompt text not null,
  response text not null,
  needs_review boolean not null,
  answered_at timestamptz not null default now(),
  constraint quick_check_prompt_not_blank check (char_length(btrim(prompt)) > 0),
  constraint quick_check_response_not_blank
    check (char_length(btrim(response)) > 0)
);

create index quick_check_responses_user_topic_idx
  on public.quick_check_responses (user_id, topic_id, answered_at desc);
create index quick_check_responses_topic_id_idx
  on public.quick_check_responses (topic_id);

alter table public.study_progress enable row level security;
alter table public.quick_check_responses enable row level security;

grant select, insert, update on public.study_progress to authenticated;
grant select, insert on public.quick_check_responses to authenticated;
grant select, insert, update, delete on public.study_progress,
  public.quick_check_responses to service_role;
grant usage, select on sequence public.quick_check_responses_id_seq
  to authenticated, service_role;

create policy study_progress_select_own
on public.study_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy study_progress_insert_own
on public.study_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy study_progress_update_own
on public.study_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy quick_check_responses_select_own
on public.quick_check_responses for select to authenticated
using ((select auth.uid()) = user_id);

create policy quick_check_responses_insert_own
on public.quick_check_responses for insert to authenticated
with check ((select auth.uid()) = user_id);
