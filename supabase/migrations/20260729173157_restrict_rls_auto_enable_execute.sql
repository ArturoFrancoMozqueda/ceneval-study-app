-- Keep the automatic RLS event trigger, but prevent clients from invoking its
-- SECURITY DEFINER function directly through the Data API.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;
