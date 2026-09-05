alter table public.exam_attempts
  add column submission_id uuid,
  add column submission_fingerprint text,
  add constraint exam_attempts_submission_pair
    check ((submission_id is null) = (submission_fingerprint is null)),
  add constraint exam_attempts_submission_fingerprint
    check (
      submission_fingerprint is null
      or submission_fingerprint ~ '^[0-9a-f]{64}$'
    );

create unique index exam_attempts_user_submission_idx
  on public.exam_attempts (user_id, submission_id)
  where submission_id is not null;

create or replace function public.save_exam_attempt_v1(
  p_user_id uuid,
  p_exam_id bigint,
  p_submission_id uuid,
  p_submission_fingerprint text,
  p_completed_at timestamptz,
  p_score integer,
  p_total_questions integer,
  p_answers jsonb
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_attempt_id bigint;
  v_answer_count integer;
begin
  if p_user_id is null
    or p_exam_id is null
    or p_exam_id <= 0
    or p_submission_id is null
    or p_submission_fingerprint !~ '^[0-9a-f]{64}$'
    or p_completed_at is null
    or p_total_questions <= 0
    or p_score < 0
    or p_score > p_total_questions
    or jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) <> p_total_questions
  then
    raise exception 'invalid exam attempt payload';
  end if;

  select count(distinct (answer ->> 'questionId')::bigint)
    into v_answer_count
  from jsonb_array_elements(p_answers) as answer;

  if v_answer_count <> p_total_questions
    or (select count(*) from public.exam_questions where exam_id = p_exam_id)
      <> p_total_questions
    or (select count(*)
        from jsonb_array_elements(p_answers) as answer
        where jsonb_typeof(answer -> 'questionId') <> 'number'
          or jsonb_typeof(answer -> 'selectedOptionId') <> 'number'
          or jsonb_typeof(answer -> 'isCorrect') <> 'boolean') > 0
    or exists (
      select 1
      from jsonb_array_elements(p_answers) as answer
      left join public.exam_questions as question
        on question.id = (answer ->> 'questionId')::bigint
       and question.exam_id = p_exam_id
      left join public.exam_options as option
        on option.id = (answer ->> 'selectedOptionId')::bigint
       and option.question_id = question.id
      where question.id is null or option.id is null
    )
    or (select count(*)
        from jsonb_array_elements(p_answers) as answer
        where (answer ->> 'isCorrect')::boolean) <> p_score
  then
    raise exception 'invalid exam answers';
  end if;

  begin
    insert into public.exam_attempts (
      user_id,
      exam_id,
      completed_at,
      score,
      total_questions,
      submission_id,
      submission_fingerprint
    ) values (
      p_user_id,
      p_exam_id,
      p_completed_at,
      p_score,
      p_total_questions,
      p_submission_id,
      p_submission_fingerprint
    )
    returning id into v_attempt_id;

    insert into public.exam_answers (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct
    )
    select
      v_attempt_id,
      (answer ->> 'questionId')::bigint,
      (answer ->> 'selectedOptionId')::bigint,
      (answer ->> 'isCorrect')::boolean
    from jsonb_array_elements(p_answers) as answer;
  exception
    when unique_violation then
      select id
        into v_attempt_id
      from public.exam_attempts
      where user_id = p_user_id
        and submission_id = p_submission_id
        and exam_id = p_exam_id
        and score = p_score
        and total_questions = p_total_questions
        and submission_fingerprint = p_submission_fingerprint;

      if v_attempt_id is null
        or (select count(*) from public.exam_answers where attempt_id = v_attempt_id)
          <> p_total_questions
      then
        raise exception 'conflicting exam submission';
      end if;
  end;

  return v_attempt_id;
end;
$$;

revoke all on function public.save_exam_attempt_v1(
  uuid, bigint, uuid, text, timestamptz, integer, integer, jsonb
) from public, anon, authenticated;
grant execute on function public.save_exam_attempt_v1(
  uuid, bigint, uuid, text, timestamptz, integer, integer, jsonb
) to service_role;
