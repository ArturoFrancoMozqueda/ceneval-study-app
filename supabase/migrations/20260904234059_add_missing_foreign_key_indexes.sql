-- Cover the referencing columns used by the five foreign keys reported by
-- Database Advisors. Existing indexes either cover only one half of the
-- composite exam relationships or lead with a different adaptive column.
create index if not exists exam_answer_keys_question_correct_option_idx
  on public.exam_answer_keys (question_id, correct_option_id);

create index if not exists exam_answers_question_selected_option_idx
  on public.exam_answers (question_id, selected_option_id);

create index if not exists practice_session_items_retrieval_item_id_idx
  on public.practice_session_items (retrieval_item_id);

create index if not exists retrieval_attempts_retrieval_item_id_idx
  on public.retrieval_attempts (retrieval_item_id);

create index if not exists retrieval_schedule_states_retrieval_item_id_idx
  on public.retrieval_schedule_states (retrieval_item_id);
