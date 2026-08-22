-- A bounded API result does not require loading an unbounded activity history:
-- one latest row per resource is selected deterministically in PostgreSQL.
drop index if exists public.flashcard_reviews_user_card_idx;
create index flashcard_reviews_user_card_idx
  on public.flashcard_reviews
    (user_id, flashcard_id, reviewed_at desc, id desc)
  include (rating, next_review_at);

drop index if exists public.quick_check_responses_user_topic_idx;
create index quick_check_responses_user_topic_idx
  on public.quick_check_responses
    (user_id, topic_id, answered_at desc, id desc)
  include (needs_review);

create or replace function public.get_review_overview_v1()
returns table (overview jsonb)
language sql
stable
security invoker
set search_path = ''
rows 1
as $$
  with latest_reviews as (
    select distinct on (review.flashcard_id)
      review.id,
      review.flashcard_id,
      review.rating,
      review.reviewed_at,
      review.next_review_at,
      card.question,
      card.answer,
      card.position,
      topic.id as topic_id,
      topic.title as topic_title,
      class_row.id as class_id,
      class_row.title as class_title,
      coalesce(class_row.curriculum_code, '') as curriculum_code
    from public.flashcard_reviews as review
    join public.flashcards as card
      on card.id = review.flashcard_id
    join public.topics as topic
      on topic.id = card.topic_id
    join public.classes as class_row
      on class_row.id = topic.class_id
    where review.user_id = (select auth.uid())
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
    order by
      review.flashcard_id,
      review.reviewed_at desc,
      review.id desc
  ),
  latest_checks as (
    select distinct on (response.topic_id)
      response.id,
      response.topic_id,
      response.needs_review,
      response.answered_at
    from public.quick_check_responses as response
    join public.topics as topic
      on topic.id = response.topic_id
    join public.classes as class_row
      on class_row.id = topic.class_id
    where response.user_id = (select auth.uid())
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
    order by
      response.topic_id,
      response.answered_at desc,
      response.id desc
  ),
  due_cards as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', review.flashcard_id,
          'question', review.question,
          'answer', review.answer,
          'position', review.position,
          'topicId', review.topic_id,
          'topicTitle', review.topic_title,
          'classId', review.class_id,
          'classTitle', review.class_title,
          'curriculumCode', review.curriculum_code,
          'rating', review.rating,
          'nextReviewAt', review.next_review_at
        )
        order by
          case review.rating
            when 'again' then 0
            when 'hard' then 1
            when 'good' then 2
            when 'easy' then 3
            else 4
          end,
          coalesce(review.next_review_at, '-infinity'::timestamptz),
          review.flashcard_id
      ) filter (
        where review.next_review_at is null
          or review.next_review_at <= statement_timestamp()
      ),
      '[]'::jsonb
    ) as cards
    from latest_reviews as review
  ),
  review_summary as (
    select
      count(*) filter (where rating in ('again', 'hard'))::integer
        as difficult_cards,
      min(next_review_at) filter (
        where next_review_at > statement_timestamp()
      ) as next_review_at
    from latest_reviews
  ),
  check_summary as (
    select count(*) filter (where needs_review)::integer as difficult_checks
    from latest_checks
  )
  select jsonb_build_object(
    'dueCards', due_cards.cards,
    'currentDifficultCards', review_summary.difficult_cards,
    'currentDifficultChecks', check_summary.difficult_checks,
    'currentDifficultCount',
      review_summary.difficult_cards + check_summary.difficult_checks,
    'nextReviewAt', review_summary.next_review_at
  ) as overview
  from due_cards
  cross join review_summary
  cross join check_summary;
$$;

revoke all on function public.get_review_overview_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.get_review_overview_v1()
  to authenticated;
