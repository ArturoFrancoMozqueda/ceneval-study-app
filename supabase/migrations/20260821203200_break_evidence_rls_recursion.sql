-- Evaluate traceable evidence visibility outside the mutually recursive RLS
-- policies while preserving all same-class integrity predicates.

begin;

create function private.can_read_traceable_evidence(
  p_evidence_id bigint,
  p_artifact_id bigint default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.editorial_artifact_evidence link
      join public.editorial_artifacts artifact on artifact.id = link.artifact_id
      join public.class_evidence evidence on evidence.id = link.evidence_id
      join public.topics topic on topic.id = artifact.topic_id
      join public.classes class_row on class_row.id = artifact.class_id
      where evidence.id = p_evidence_id
        and (p_artifact_id is null or artifact.id = p_artifact_id)
        and evidence.class_id = artifact.class_id
        and topic.class_id = artifact.class_id
        and topic.approval_status = 'approved'
        and class_row.publication_status = 'published'
    );
$$;

revoke all on function private.can_read_traceable_evidence(bigint, bigint)
  from public, anon, authenticated;
grant execute on function private.can_read_traceable_evidence(bigint, bigint)
  to authenticated;

drop policy if exists class_evidence_select_published_or_admin
  on public.class_evidence;
create policy class_evidence_select_published_or_admin
on public.class_evidence for select to authenticated
using (
  (select private.is_admin())
  or private.can_read_traceable_evidence(class_evidence.id, null)
);

drop policy if exists editorial_artifact_evidence_select_published_or_admin
  on public.editorial_artifact_evidence;
create policy editorial_artifact_evidence_select_published_or_admin
on public.editorial_artifact_evidence for select to authenticated
using (
  (select private.is_admin())
  or private.can_read_traceable_evidence(
    editorial_artifact_evidence.evidence_id,
    editorial_artifact_evidence.artifact_id
  )
);

commit;
