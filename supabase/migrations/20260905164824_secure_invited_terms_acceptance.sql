-- Record consent with a server-owned timestamp and make it a database-level
-- prerequisite for every RLS-protected application resource except the
-- caller's profile (which must remain readable before consent is recorded).

revoke update (terms_accepted_at) on public.profiles from authenticated;

create or replace function public.accept_terms_v1()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_at timestamptz;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  update public.profiles
  set terms_accepted_at = coalesce(terms_accepted_at, now())
  where id = auth.uid()
    and role in ('admin', 'student')
  returning terms_accepted_at into accepted_at;

  if accepted_at is null then
    raise insufficient_privilege using message = 'Valid profile required';
  end if;

  return accepted_at;
end;
$$;

revoke all on function public.accept_terms_v1() from public, anon;
grant execute on function public.accept_terms_v1() to authenticated;

create or replace function private.has_study_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role = 'admin'
        or (role = 'student' and terms_accepted_at is not null)
      )
  );
$$;

revoke all on function private.has_study_access() from public, anon, authenticated;
grant execute on function private.has_study_access() to authenticated;

do $$
declare
  protected_table text;
begin
  foreach protected_table in array array[
    'class_audio_sources',
    'class_editorial_reviews',
    'class_evidence',
    'classes',
    'concept_maps',
    'editorial_artifact_evidence',
    'editorial_artifacts',
    'exam_answer_keys',
    'exam_answers',
    'exam_attempts',
    'exam_options',
    'exam_questions',
    'exams',
    'flashcard_reviews',
    'flashcards',
    'legal_references',
    'practice_session_items',
    'practice_sessions',
    'quick_check_responses',
    'retrieval_attempts',
    'retrieval_item_answer_keys',
    'retrieval_item_evidence',
    'retrieval_items',
    'retrieval_schedule_states',
    'study_materials',
    'study_progress',
    'subjects',
    'topic_learning_journeys',
    'topic_references',
    'topics'
  ]
  loop
    execute format(
      'create policy accepted_terms_access_gate on public.%I as restrictive for all to authenticated using (private.has_study_access()) with check (private.has_study_access())',
      protected_table
    );
  end loop;
end;
$$;
