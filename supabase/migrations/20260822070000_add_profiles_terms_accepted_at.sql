-- Record when a student accepted the terms of use and privacy notice at
-- sign-up, so it can be shown as evidence of consent under the LFPDPPP.
-- Task L-3 of docs/PLAN_ACCION_VENTA.md.
--
-- NOT applied to any database by this change. This is a migration file
-- only; no local or remote Supabase project has been touched.

alter table public.profiles
  add column terms_accepted_at timestamptz;

-- The sign-up form now sends the acceptance instant as ISO 8601 text in
-- auth user metadata (`terms_accepted_at`). Extend the existing trigger so
-- new profiles capture it at creation time; existing profiles are left
-- untouched (null means "accepted before this column existed" or "not yet
-- recorded", never "declined").
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, terms_accepted_at)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    'student',
    case
      when nullif(btrim(new.raw_user_meta_data ->> 'terms_accepted_at'), '')
        is not null
        then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
      else null
    end
  );
  return new;
end;
$$;
