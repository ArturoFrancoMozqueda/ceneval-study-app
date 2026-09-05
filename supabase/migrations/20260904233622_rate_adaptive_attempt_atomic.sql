begin;

-- Rating an adaptive attempt advances several related records. Keep the
-- transition in one database transaction so a failed retry enqueue or session
-- update cannot leave an attempt rated without its schedule and queue state.
create function public.rate_adaptive_attempt_v1(
  p_attempt_id uuid,
  p_user_id uuid,
  p_outcome text,
  p_stage smallint,
  p_success_streak integer,
  p_lapse_count integer,
  p_last_confidence text,
  p_reviewed_at timestamptz,
  p_next_review_at timestamptz,
  p_scheduler_version text
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  locked_attempt public.retrieval_attempts%rowtype;
  locked_session public.practice_sessions%rowtype;
  persisted_state public.retrieval_schedule_states%rowtype;
  next_position smallint;
  affected_rows integer;
  instruction text;
begin
  if p_attempt_id is null
     or p_user_id is null
     or p_outcome is null
     or p_outcome not in ('incorrect', 'partial', 'correct')
     or p_stage is null
     or p_stage not between 0 and 5
     or p_success_streak is null
     or p_success_streak < 0
     or p_lapse_count is null
     or p_lapse_count < 0
     or p_last_confidence is null
     or p_last_confidence not in ('sure', 'unsure', 'no_recall')
     or p_reviewed_at is null
     or p_next_review_at is null
     or p_next_review_at < p_reviewed_at
     or p_scheduler_version is null
     or p_scheduler_version <> 'spacing-v1'
  then
    return jsonb_build_object('status', 'invalid');
  end if;

  select attempt.*
    into locked_attempt
    from public.retrieval_attempts as attempt
   where attempt.id = p_attempt_id
     and attempt.user_id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('status', 'unavailable');
  end if;

  -- Concurrent retries are idempotent: the first transaction owns the row
  -- lock, and later calls receive the already-persisted result.
  if locked_attempt.outcome is not null then
    select state.*
      into persisted_state
      from public.retrieval_schedule_states as state
     where state.user_id = p_user_id
       and state.retrieval_item_id = locked_attempt.retrieval_item_id;
    if not found or persisted_state.last_outcome is null then
      return jsonb_build_object('status', 'unavailable');
    end if;

    instruction := case persisted_state.last_outcome
      when 'incorrect' then 'retry_in_session'
      when 'partial' then 'review_tomorrow'
      else 'advance'
    end;
    return jsonb_build_object(
      'status', 'success',
      'nextReviewAt', persisted_state.next_review_at,
      'stage', persisted_state.stage,
      'instruction', instruction
    );
  end if;

  if p_last_confidence <> locked_attempt.confidence
     or p_reviewed_at < locked_attempt.revealed_at
  then
    return jsonb_build_object('status', 'invalid');
  end if;

  select session.*
    into locked_session
    from public.practice_sessions as session
    join public.practice_session_items as session_item
      on session_item.session_id = session.id
     and session_item.position = locked_attempt.session_position
   where session.id = locked_attempt.session_id
     and session.user_id = p_user_id
     and session.status = 'active'
     and session.current_position = locked_attempt.session_position
     and session_item.retrieval_item_id = locked_attempt.retrieval_item_id
     and session_item.status = 'revealed'
   for update of session, session_item;

  if not found then
    return jsonb_build_object('status', 'unavailable');
  end if;

  update public.retrieval_attempts
     set outcome = p_outcome,
         rated_at = p_reviewed_at
   where id = locked_attempt.id
     and user_id = p_user_id
     and outcome is null;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'No se pudo fijar el resultado adaptativo.' using errcode = '40001';
  end if;

  insert into public.retrieval_schedule_states (
    user_id,
    retrieval_item_id,
    stage,
    success_streak,
    lapse_count,
    last_confidence,
    last_outcome,
    last_reviewed_at,
    next_review_at,
    scheduler_version
  ) values (
    p_user_id,
    locked_attempt.retrieval_item_id,
    p_stage,
    p_success_streak,
    p_lapse_count,
    p_last_confidence,
    p_outcome,
    p_reviewed_at,
    p_next_review_at,
    p_scheduler_version
  )
  on conflict (user_id, retrieval_item_id) do update
    set stage = excluded.stage,
        success_streak = excluded.success_streak,
        lapse_count = excluded.lapse_count,
        last_confidence = excluded.last_confidence,
        last_outcome = excluded.last_outcome,
        last_reviewed_at = excluded.last_reviewed_at,
        next_review_at = excluded.next_review_at,
        scheduler_version = excluded.scheduler_version;

  update public.practice_session_items
     set status = 'rated'
   where session_id = locked_session.id
     and position = locked_session.current_position
     and retrieval_item_id = locked_attempt.retrieval_item_id
     and status = 'revealed';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'No se pudo cerrar el reactivo adaptativo.' using errcode = '40001';
  end if;

  if p_outcome = 'incorrect' then
    perform public.enqueue_retrieval_retry_v1(
      locked_session.id,
      p_user_id,
      locked_attempt.retrieval_item_id,
      locked_session.current_position
    );
  end if;

  select min(position)::smallint
    into next_position
    from public.practice_session_items
   where session_id = locked_session.id
     and position > locked_session.current_position
     and status = 'queued';

  if next_position is null then
    update public.practice_sessions
       set status = 'completed',
           completed_at = p_reviewed_at,
           last_activity_at = p_reviewed_at
     where id = locked_session.id
       and user_id = p_user_id
       and status = 'active';
  else
    update public.practice_sessions
       set current_position = next_position,
           last_activity_at = p_reviewed_at
     where id = locked_session.id
       and user_id = p_user_id
       and status = 'active';
  end if;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'No se pudo avanzar la sesión adaptativa.' using errcode = '40001';
  end if;

  instruction := case p_outcome
    when 'incorrect' then 'retry_in_session'
    when 'partial' then 'review_tomorrow'
    else 'advance'
  end;
  return jsonb_build_object(
    'status', 'success',
    'nextReviewAt', p_next_review_at,
    'stage', p_stage,
    'instruction', instruction
  );
end;
$$;

revoke all on function public.rate_adaptive_attempt_v1(
  uuid, uuid, text, smallint, integer, integer, text, timestamptz, timestamptz, text
) from public, anon, authenticated;
grant execute on function public.rate_adaptive_attempt_v1(
  uuid, uuid, text, smallint, integer, integer, text, timestamptz, timestamptz, text
) to service_role;

commit;
