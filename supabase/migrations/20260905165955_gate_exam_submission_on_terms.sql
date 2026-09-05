-- The atomic exam RPC is intentionally SECURITY DEFINER so it can grade with
-- hidden answer keys. Put the privileged implementation outside the exposed
-- schema (which must never be exposed by the Data API) and keep a SECURITY
-- INVOKER gate at the public boundary.

alter function public.submit_exam_v1(bigint, jsonb) set schema private;

revoke all on function private.submit_exam_v1(bigint, jsonb)
  from public, anon, authenticated;
grant execute on function private.submit_exam_v1(bigint, jsonb)
  to authenticated;

create function public.submit_exam_v1(
  p_exam_id bigint,
  p_answers jsonb
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if not private.has_study_access() then
    raise insufficient_privilege using message = 'Terms acceptance required';
  end if;

  return private.submit_exam_v1(p_exam_id, p_answers);
end;
$$;

revoke all on function public.submit_exam_v1(bigint, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_exam_v1(bigint, jsonb)
  to authenticated;

comment on function public.submit_exam_v1(bigint, jsonb) is
  'Requires accepted terms, then delegates atomic grading to a private privileged implementation.';
