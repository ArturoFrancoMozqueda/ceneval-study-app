create or replace function public.create_topic_with_next_position(
  p_class_id bigint,
  p_title text,
  p_description text default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_topic_id bigint;
begin
  if p_class_id is null or p_class_id <= 0 then
    raise exception using errcode = '22023', message = 'invalid class id';
  end if;

  if p_title is null
    or char_length(btrim(p_title)) = 0
    or char_length(btrim(p_title)) > 120 then
    raise exception using errcode = '22023', message = 'invalid topic title';
  end if;

  if p_description is not null and char_length(btrim(p_description)) > 400 then
    raise exception using errcode = '22023', message = 'invalid topic description';
  end if;

  -- A transaction-scoped lock per class serializes only competing positions
  -- for that class and is released automatically after this short insert.
  perform pg_advisory_xact_lock(
    hashtextextended('ceneval:topic-position:' || p_class_id::text, 0)
  );

  insert into public.topics (
    class_id,
    title,
    description,
    position,
    source_type,
    approval_status
  )
  select
    p_class_id,
    btrim(p_title),
    nullif(btrim(p_description), ''),
    coalesce(max(position), 0) + 1,
    'manual',
    'approved'
  from public.topics
  where class_id = p_class_id
  returning id into new_topic_id;

  return new_topic_id;
end;
$$;

comment on function public.create_topic_with_next_position(bigint, text, text)
  is 'Creates one manual topic at the next class position under a transaction-scoped advisory lock.';

revoke execute on function public.create_topic_with_next_position(bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.create_topic_with_next_position(bigint, text, text)
  to service_role;
