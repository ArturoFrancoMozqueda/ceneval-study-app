-- A withdrawn class keeps its content and publication history, but is no
-- longer visible to students because existing RLS policies expose only
-- `published` classes.
alter table public.classes
  drop constraint classes_publication_status_allowed;

alter table public.classes
  add constraint classes_publication_status_allowed
  check (publication_status in ('draft', 'review', 'published', 'withdrawn'));
