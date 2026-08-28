-- Optional, user-owned planning preference. This is not an exam registration
-- record and does not claim to predict learning or exam performance.
alter table public.profiles
  add column exam_target_date date,
  add column exam_target_heuristic_version text,
  add constraint profiles_exam_target_heuristic_consistent check (
    (exam_target_date is null and exam_target_heuristic_version is null)
    or (
      exam_target_date is not null
      and exam_target_heuristic_version = 'spacing-v1-exam-date-v1'
    )
  );

-- Replace broad table UPDATE with explicit mutable columns. RLS still scopes
-- the row to auth.uid(); column privileges prevent self-promotion through role.
revoke update on public.profiles from authenticated;
grant update (full_name, exam_target_date, exam_target_heuristic_version)
  on public.profiles to authenticated;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
