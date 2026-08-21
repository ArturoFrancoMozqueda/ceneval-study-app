-- Student-readable study resources must belong to an approved topic in a
-- published class. Administrators retain editorial visibility at every level.

begin;

drop policy if exists topics_select_published_or_admin on public.topics;
create policy topics_select_published_or_admin
on public.topics for select to authenticated
using (
  (select private.is_admin())
  or (
    topics.approval_status = 'approved'
    and exists (
      select 1
      from public.classes
      where classes.id = topics.class_id
        and classes.publication_status = 'published'
    )
  )
);

drop policy if exists study_materials_select_published_or_admin
  on public.study_materials;
create policy study_materials_select_published_or_admin
on public.study_materials for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = study_materials.topic_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
      and study_materials.is_current
  )
);

drop policy if exists references_select_published_or_admin
  on public.legal_references;
create policy references_select_published_or_admin
on public.legal_references for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topic_references
    join public.topics on topics.id = topic_references.topic_id
    join public.classes on classes.id = topics.class_id
    where topic_references.reference_id = legal_references.id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
  )
);

drop policy if exists topic_references_select_published_or_admin
  on public.topic_references;
create policy topic_references_select_published_or_admin
on public.topic_references for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = topic_references.topic_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
  )
);

drop policy if exists concept_maps_select_published_or_admin
  on public.concept_maps;
create policy concept_maps_select_published_or_admin
on public.concept_maps for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = concept_maps.topic_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
      and concept_maps.is_current
  )
);

drop policy if exists flashcards_select_published_or_admin
  on public.flashcards;
create policy flashcards_select_published_or_admin
on public.flashcards for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = flashcards.topic_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
  )
);

drop policy if exists exams_select_published_or_admin on public.exams;
create policy exams_select_published_or_admin
on public.exams for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics
    join public.classes on classes.id = topics.class_id
    where topics.id = exams.topic_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

drop policy if exists exam_questions_select_published_or_admin
  on public.exam_questions;
create policy exam_questions_select_published_or_admin
on public.exam_questions for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.exams
    join public.topics on topics.id = exams.topic_id
    join public.classes on classes.id = topics.class_id
    where exams.id = exam_questions.exam_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

drop policy if exists exam_options_select_published_or_admin
  on public.exam_options;
create policy exam_options_select_published_or_admin
on public.exam_options for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.exam_questions
    join public.exams on exams.id = exam_questions.exam_id
    join public.topics on topics.id = exams.topic_id
    join public.classes on classes.id = topics.class_id
    where exam_questions.id = exam_options.question_id
      and topics.approval_status = 'approved'
      and classes.publication_status = 'published'
      and exams.is_current
  )
);

commit;
