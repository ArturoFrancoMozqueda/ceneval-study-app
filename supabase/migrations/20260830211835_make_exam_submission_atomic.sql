-- Grade and persist an exam in one database transaction. The function is the
-- only student write path for attempts and deliberately keeps answer keys
-- behind a SECURITY DEFINER boundary with an explicit authenticated-user check.

begin;

-- These composite relationships prevent a correct/selected option from being
-- attached to a different question, including through privileged imports.
alter table public.exam_options
  add constraint exam_options_question_id_id_unique unique (question_id, id);

alter table public.exam_answer_keys
  add constraint exam_answer_keys_option_belongs_to_question
  foreign key (question_id, correct_option_id)
  references public.exam_options (question_id, id)
  on delete cascade;

alter table public.exam_answers
  add constraint exam_answers_option_belongs_to_question
  foreign key (question_id, selected_option_id)
  references public.exam_options (question_id, id)
  on delete cascade;

-- Mirror the existing Server Action validation at the database boundary so an
-- authenticated Data API caller cannot persist values the product rejects.
alter table public.study_progress
  add constraint study_progress_material_index_bounded
    check (material_index <= 100),
  add constraint study_progress_completed_steps_bounded
    check (
      cardinality(completed_steps) <= 5
      and completed_steps <@ array[
        'discover', 'understand', 'apply', 'remember', 'check'
      ]::text[]
      and cardinality(array_positions(completed_steps, 'discover')) <= 1
      and cardinality(array_positions(completed_steps, 'understand')) <= 1
      and cardinality(array_positions(completed_steps, 'apply')) <= 1
      and cardinality(array_positions(completed_steps, 'remember')) <= 1
      and cardinality(array_positions(completed_steps, 'check')) <= 1
    );

alter table public.quick_check_responses
  add constraint quick_check_prompt_length_valid
    check (char_length(prompt) <= 500),
  add constraint quick_check_response_length_valid
    check (char_length(response) <= 1000);

create or replace function public.submit_exam_v1(
  p_exam_id bigint,
  p_answers jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_question_count integer;
  v_answer_count integer;
  v_score integer;
  v_attempt_id bigint;
  v_review jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_exam_id is null or p_exam_id <= 0
    or p_answers is null or jsonb_typeof(p_answers) <> 'object'
  then
    return jsonb_build_object('status', 'invalid');
  end if;

  if not exists (
    select 1
    from public.exams
    join public.topics on topics.id = exams.topic_id
    join public.classes on classes.id = topics.class_id
    where exams.id = p_exam_id
      and exams.is_current
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
  ) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  select count(*)::integer
  into v_question_count
  from public.exam_questions
  where exam_id = p_exam_id;

  if v_question_count = 0 then
    raise exception 'Exam configuration has no questions.' using errcode = 'P0001';
  end if;

  select count(*)::integer
  into v_answer_count
  from jsonb_each(p_answers);

  -- Validate the JSON again inside the trusted boundary because the RPC is
  -- reachable independently of the Server Action.
  if exists (
    select 1
    from jsonb_each(p_answers) answer
    where answer.key !~ '^[1-9][0-9]*$'
      or jsonb_typeof(answer.value) <> 'number'
      or answer.value #>> '{}' !~ '^[1-9][0-9]*$'
  ) then
    return jsonb_build_object('status', 'invalid');
  end if;

  if exists (
    select 1
    from jsonb_each(p_answers) answer
    where answer.key::numeric > 9223372036854775807
      or (answer.value #>> '{}')::numeric > 9223372036854775807
  ) then
    return jsonb_build_object('status', 'invalid');
  end if;

  if exists (
    select 1
    from jsonb_each(p_answers) answer
    where not exists (
      select 1
      from public.exam_questions question
      where question.exam_id = p_exam_id
        and question.id = answer.key::bigint
    )
  ) then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_answer_count < v_question_count then
    return jsonb_build_object('status', 'incomplete');
  end if;
  if v_answer_count <> v_question_count then
    return jsonb_build_object('status', 'invalid');
  end if;

  if exists (
    select 1
    from jsonb_each(p_answers) answer
    join public.exam_questions question
      on question.id = answer.key::bigint
      and question.exam_id = p_exam_id
    left join public.exam_options selected_option
      on selected_option.id = (answer.value #>> '{}')::bigint
      and selected_option.question_id = question.id
    where selected_option.id is null
  ) then
    return jsonb_build_object('status', 'invalid');
  end if;

  -- Missing or malformed keys are an editorial/database fault, not a student
  -- validation error. Raising aborts the whole call and leaves no partial row.
  if exists (
    select 1
    from public.exam_questions question
    left join public.exam_answer_keys answer_key
      on answer_key.question_id = question.id
    left join public.exam_options correct_option
      on correct_option.id = answer_key.correct_option_id
      and correct_option.question_id = question.id
    join jsonb_each(p_answers) answer on answer.key::bigint = question.id
    where question.exam_id = p_exam_id
      and (
        answer_key.question_id is null
        or correct_option.id is null
        or nullif(btrim(answer_key.explanation), '') is null
        or jsonb_typeof(
          answer_key.option_explanations -> (answer.value #>> '{}')
        ) <> 'string'
        or nullif(
          btrim(answer_key.option_explanations ->> (answer.value #>> '{}')),
          ''
        ) is null
      )
  ) then
    raise exception 'Exam answer key configuration is invalid.' using errcode = 'P0001';
  end if;

  select
    count(*) filter (
      where answer_key.correct_option_id = (answer.value #>> '{}')::bigint
    )::integer,
    jsonb_agg(
      jsonb_build_object(
        'questionId', question.id,
        'correct', answer_key.correct_option_id = (answer.value #>> '{}')::bigint,
        'explanation', answer_key.explanation,
        'selectedOptionExplanation',
          answer_key.option_explanations ->> (answer.value #>> '{}')
      )
      order by question.position
    )
  into v_score, v_review
  from public.exam_questions question
  join public.exam_answer_keys answer_key
    on answer_key.question_id = question.id
  join jsonb_each(p_answers) answer on answer.key::bigint = question.id
  where question.exam_id = p_exam_id;

  insert into public.exam_attempts (
    user_id,
    exam_id,
    completed_at,
    score,
    total_questions
  )
  values (
    v_user_id,
    p_exam_id,
    now(),
    v_score,
    v_question_count
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
    question.id,
    (answer.value #>> '{}')::bigint,
    answer_key.correct_option_id = (answer.value #>> '{}')::bigint
  from public.exam_questions question
  join public.exam_answer_keys answer_key
    on answer_key.question_id = question.id
  join jsonb_each(p_answers) answer on answer.key::bigint = question.id
  where question.exam_id = p_exam_id;

  return jsonb_build_object(
    'status', 'success',
    'id', v_attempt_id,
    'score', v_score,
    'total', v_question_count,
    'review', v_review
  );
end;
$$;

revoke all on function public.submit_exam_v1(bigint, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_exam_v1(bigint, jsonb)
  to authenticated;

comment on function public.submit_exam_v1(bigint, jsonb) is
  'Validates, grades and persists one authenticated student exam atomically without exposing answer keys.';

commit;
