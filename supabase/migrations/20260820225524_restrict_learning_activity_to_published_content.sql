-- Student-owned activity may only reference content that is currently published.
-- Editorial access remains unchanged; service_role continues to bypass RLS.

begin;

drop policy if exists flashcard_reviews_insert_own
  on public.flashcard_reviews;
create policy flashcard_reviews_insert_own
on public.flashcard_reviews for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.flashcards
    join public.topics on topics.id = flashcards.topic_id
    join public.classes on classes.id = topics.class_id
    where flashcards.id = flashcard_reviews.flashcard_id
      and classes.publication_status = 'published'
  )
);

drop policy if exists study_progress_insert_own
  on public.study_progress;
create policy study_progress_insert_own
on public.study_progress for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = study_progress.topic_id
      and classes.publication_status = 'published'
  )
);

drop policy if exists study_progress_update_own
  on public.study_progress;
create policy study_progress_update_own
on public.study_progress for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = study_progress.topic_id
      and classes.publication_status = 'published'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = study_progress.topic_id
      and classes.publication_status = 'published'
  )
);

drop policy if exists quick_check_responses_insert_own
  on public.quick_check_responses;
create policy quick_check_responses_insert_own
on public.quick_check_responses for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = quick_check_responses.topic_id
      and classes.publication_status = 'published'
  )
);

commit;
