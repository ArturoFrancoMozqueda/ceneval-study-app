-- Older CENEVAL environments may contain this helper from a manual security
-- hardening step. Fresh environments do not. Revoke access when present while
-- keeping the committed migration portable and safe to replay.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() '
      || 'from public, anon, authenticated';
  end if;
end;
$$;
