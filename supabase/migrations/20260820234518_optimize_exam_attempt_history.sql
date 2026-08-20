-- Supports the authenticated, newest-first history query without scanning
-- incomplete attempts or earlier users' rows.
create index exam_attempts_user_history_idx
  on public.exam_attempts (user_id, id desc)
  where completed_at is not null
    and score is not null
    and total_questions is not null;
