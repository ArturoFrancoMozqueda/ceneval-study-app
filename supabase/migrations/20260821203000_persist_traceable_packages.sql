begin;

grant usage on schema private to service_role;

alter table public.topic_references add column position integer;
with ranked as (
  select topic_id, reference_id,
    row_number() over (partition by topic_id order by reference_id)::integer as position
  from public.topic_references
)
update public.topic_references link
set position = ranked.position
from ranked
where ranked.topic_id = link.topic_id
  and ranked.reference_id = link.reference_id;
alter table public.topic_references alter column position set not null;
alter table public.topic_references
  add constraint topic_references_position_positive check (position > 0),
  add constraint topic_references_topic_position_unique unique (topic_id, position);

-- Contract 1.2 keeps evidence separate from the learning artifacts it supports.
-- The import entrypoint is intentionally exposed only to service_role.
create table public.class_evidence (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.classes (id) on delete cascade,
  evidence_key text not null,
  evidence_kind text not null,
  audio_number integer,
  locator jsonb not null,
  title text,
  url text,
  institution text,
  jurisdiction text,
  retrieved_on date,
  verified_on date,
  created_at timestamptz not null default now(),
  constraint class_evidence_key_format
    check (evidence_key ~ '^ev-[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint class_evidence_kind_allowed
    check (evidence_kind in ('transcript', 'official')),
  constraint class_evidence_transcript_shape check (
    evidence_kind <> 'transcript'
    or (
      audio_number between 1 and 70
      and jsonb_typeof(locator) = 'object'
      and locator ->> 'type' in ('line_range', 'timestamp')
      and title is null and url is null and institution is null
      and jurisdiction is null and retrieved_on is null and verified_on is null
    )
  ),
  constraint class_evidence_official_shape check (
    evidence_kind <> 'official'
    or (
      audio_number is null
      and title is not null and url is not null
      and institution is not null and jurisdiction is not null
      and jsonb_typeof(locator) = 'string'
      and char_length(btrim(title)) > 0
      and url ~ '^https://'
      and char_length(btrim(institution)) > 0
      and char_length(btrim(jurisdiction)) > 0
      and retrieved_on is not null
      and verified_on is not null
      and verified_on >= retrieved_on
    )
  ),
  unique (class_id, evidence_key)
);

create index class_evidence_class_id_idx on public.class_evidence (class_id);

create table public.topic_learning_journeys (
  id bigint generated always as identity primary key,
  topic_id bigint not null unique references public.topics (id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topic_learning_journeys_object check (jsonb_typeof(content) = 'object'),
  constraint topic_learning_journeys_quick_checks check (
    content ?& array[
      'openingPrompt', 'quickChecks', 'practicalCase',
      'closingPrompt', 'nextActivity'
    ]
    and jsonb_typeof(content -> 'quickChecks') = 'array'
    and jsonb_array_length(content -> 'quickChecks') >= 2
  )
);

create table public.editorial_artifacts (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.classes (id) on delete cascade,
  topic_id bigint not null references public.topics (id) on delete cascade,
  artifact_kind text not null,
  source_kind text not null,
  source_id bigint not null,
  component text not null,
  component_index integer,
  artifact_path text not null,
  created_at timestamptz not null default now(),
  constraint editorial_artifacts_kind_allowed check (
    artifact_kind in (
      'learning_prompt', 'quick_check', 'practical_case', 'material',
      'concept_map_node', 'flashcard', 'exam_question', 'exam_option',
      'correct_option', 'exam_explanation', 'option_explanation'
    )
  ),
  constraint editorial_artifacts_source_allowed check (
    source_kind in (
      'learning_journey', 'study_material', 'concept_map', 'flashcard',
      'exam_question', 'exam_option'
    )
  ),
  constraint editorial_artifacts_component_index_valid
    check (component_index is null or component_index >= 0),
  unique (class_id, artifact_path)
);

create index editorial_artifacts_class_id_idx
  on public.editorial_artifacts (class_id);
create index editorial_artifacts_topic_id_idx
  on public.editorial_artifacts (topic_id);
create index editorial_artifacts_source_idx
  on public.editorial_artifacts (source_kind, source_id);

create table public.editorial_artifact_evidence (
  artifact_id bigint not null
    references public.editorial_artifacts (id) on delete cascade,
  evidence_id bigint not null
    references public.class_evidence (id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  primary key (artifact_id, evidence_id),
  constraint editorial_artifact_evidence_position_positive check (position > 0),
  constraint editorial_artifact_evidence_artifact_position_unique
    unique (artifact_id, position)
);

create index editorial_artifact_evidence_evidence_idx
  on public.editorial_artifact_evidence (evidence_id);

alter table public.class_evidence enable row level security;
alter table public.topic_learning_journeys enable row level security;
alter table public.editorial_artifacts enable row level security;
alter table public.editorial_artifact_evidence enable row level security;

revoke all on table public.class_evidence from public, anon, authenticated;
revoke all on table public.topic_learning_journeys from public, anon, authenticated;
revoke all on table public.editorial_artifacts from public, anon, authenticated;
revoke all on table public.editorial_artifact_evidence from public, anon, authenticated;

grant select on public.class_evidence, public.topic_learning_journeys,
  public.editorial_artifacts, public.editorial_artifact_evidence
  to authenticated;
grant select, insert, update, delete on public.class_evidence,
  public.topic_learning_journeys, public.editorial_artifacts,
  public.editorial_artifact_evidence to service_role;
revoke all on sequence public.class_evidence_id_seq,
  public.topic_learning_journeys_id_seq, public.editorial_artifacts_id_seq
  from public, anon, authenticated;
grant usage, select on sequence public.class_evidence_id_seq,
  public.topic_learning_journeys_id_seq, public.editorial_artifacts_id_seq
  to service_role;

create policy class_evidence_select_published_or_admin
on public.class_evidence for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.editorial_artifact_evidence link
    join public.editorial_artifacts artifact on artifact.id = link.artifact_id
    join public.topics topic on topic.id = artifact.topic_id
    join public.classes class_row on class_row.id = artifact.class_id
    where link.evidence_id = class_evidence.id
      and artifact.class_id = class_evidence.class_id
      and topic.class_id = artifact.class_id
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
  )
);

create policy topic_learning_journeys_select_published_or_admin
on public.topic_learning_journeys for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics topic
    join public.classes class_row on class_row.id = topic.class_id
    where topic.id = topic_learning_journeys.topic_id
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
  )
);

create policy editorial_artifacts_select_published_or_admin
on public.editorial_artifacts for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.topics topic
    join public.classes class_row on class_row.id = topic.class_id
    where topic.id = editorial_artifacts.topic_id
      and topic.class_id = editorial_artifacts.class_id
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
  )
);

create policy editorial_artifact_evidence_select_published_or_admin
on public.editorial_artifact_evidence for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.editorial_artifacts artifact
    join public.class_evidence evidence
      on evidence.id = editorial_artifact_evidence.evidence_id
    join public.topics topic on topic.id = artifact.topic_id
    join public.classes class_row on class_row.id = artifact.class_id
    where artifact.id = editorial_artifact_evidence.artifact_id
      and evidence.class_id = artifact.class_id
      and topic.class_id = artifact.class_id
      and topic.approval_status = 'approved'
      and class_row.publication_status = 'published'
  )
);

create function private.link_artifact_evidence(
  p_class_id bigint,
  p_topic_id bigint,
  p_artifact_kind text,
  p_source_kind text,
  p_source_id bigint,
  p_component text,
  p_component_index integer,
  p_artifact_path text,
  p_evidence_keys jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  artifact_id bigint;
  linked_count integer;
  requested_count integer;
begin
  if jsonb_typeof(p_evidence_keys) <> 'array'
     or jsonb_array_length(p_evidence_keys) = 0 then
    raise exception 'Cada artefacto requiere al menos una evidencia.'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_evidence_keys) item
    where jsonb_typeof(item) <> 'string'
  ) then
    raise exception 'Los vínculos de evidencia deben contener IDs de texto.'
      using errcode = '23514';
  end if;

  select count(distinct value), count(*)
  into linked_count, requested_count
  from jsonb_array_elements_text(p_evidence_keys);
  if linked_count <> requested_count then
    raise exception 'Un artefacto no puede repetir la misma evidencia.'
      using errcode = '23505';
  end if;

  insert into public.editorial_artifacts (
    class_id, topic_id, artifact_kind, source_kind, source_id,
    component, component_index, artifact_path
  ) values (
    p_class_id, p_topic_id, p_artifact_kind, p_source_kind, p_source_id,
    p_component, p_component_index, p_artifact_path
  ) returning id into artifact_id;

  insert into public.editorial_artifact_evidence (
    artifact_id, evidence_id, position
  )
  select artifact_id, evidence.id, requested.position::integer
  from jsonb_array_elements_text(p_evidence_keys)
    with ordinality requested(evidence_key, position)
  join public.class_evidence evidence
    on evidence.class_id = p_class_id
   and evidence.evidence_key = requested.evidence_key;

  get diagnostics linked_count = row_count;
  if linked_count <> requested_count then
    raise exception 'Un artefacto referencia evidencia inexistente.'
      using errcode = '23503';
  end if;
end;
$$;

revoke all on function private.link_artifact_evidence(
  bigint, bigint, text, text, bigint, text, integer, text, jsonb
) from public, anon, authenticated;
grant execute on function private.link_artifact_evidence(
  bigint, bigint, text, text, bigint, text, integer, text, jsonb
) to service_role;

create function private.class_has_complete_evidence(p_class_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    exists (select 1 from public.class_evidence where class_id = p_class_id)
    and not exists (
      select 1 from public.class_evidence evidence
      where evidence.class_id = p_class_id
        and not exists (
          select 1 from public.editorial_artifact_evidence link
          join public.editorial_artifacts artifact on artifact.id = link.artifact_id
          where link.evidence_id = evidence.id
            and artifact.class_id = evidence.class_id
        )
    )
    and not exists (
      select 1 from public.editorial_artifacts artifact
      where artifact.class_id = p_class_id
        and not exists (
          select 1 from public.editorial_artifact_evidence link
          join public.class_evidence evidence on evidence.id = link.evidence_id
          where link.artifact_id = artifact.id
            and evidence.class_id = artifact.class_id
        )
    )
    and not exists (
      select 1 from public.topics topic
      where topic.class_id = p_class_id
        and not exists (
          select 1 from public.topic_learning_journeys journey
          where journey.topic_id = topic.id
        )
    )
    and not exists (
      select 1
      from public.topic_learning_journeys journey
      join public.topics topic on topic.id = journey.topic_id
      where topic.class_id = p_class_id
        and (
          select count(*) from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'learning_journey'
            and artifact.source_id = journey.id
        ) <> jsonb_array_length(journey.content -> 'quickChecks') + 4
    )
    and not exists (
      select 1
      from public.concept_maps map
      join public.topics topic on topic.id = map.topic_id
      where topic.class_id = p_class_id and map.is_current
        and (
          select count(*) from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'concept_map'
            and artifact.source_id = map.id
        ) <> jsonb_array_length(map.nodes)
    )
    and not exists (
      select 1 from public.study_materials material
      join public.topics topic on topic.id = material.topic_id
      where topic.class_id = p_class_id and material.is_current
        and not exists (
          select 1 from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'study_material'
            and artifact.source_id = material.id
        )
    )
    and not exists (
      select 1 from public.flashcards card
      join public.topics topic on topic.id = card.topic_id
      where topic.class_id = p_class_id
        and not exists (
          select 1 from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'flashcard'
            and artifact.source_id = card.id
        )
    )
    and not exists (
      select 1 from public.exam_questions question
      join public.exams exam on exam.id = question.exam_id
      join public.topics topic on topic.id = exam.topic_id
      where topic.class_id = p_class_id and exam.is_current
        and (
          select count(*) from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'exam_question'
            and artifact.source_id = question.id
        ) <> 3
    )
    and not exists (
      select 1 from public.exam_options option_row
      join public.exam_questions question on question.id = option_row.question_id
      join public.exams exam on exam.id = question.exam_id
      join public.topics topic on topic.id = exam.topic_id
      where topic.class_id = p_class_id and exam.is_current
        and (
          select count(*) from public.editorial_artifacts artifact
          where artifact.class_id = p_class_id
            and artifact.source_kind = 'exam_option'
            and artifact.source_id = option_row.id
        ) <> 2
    );
$$;

revoke all on function private.class_has_complete_evidence(bigint)
  from public, anon, authenticated;
grant execute on function private.class_has_complete_evidence(bigint)
  to service_role;

create function private.invalidate_class_review_from_evidence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_class_id bigint;
begin
  if tg_table_name = 'class_evidence' then
    affected_class_id := coalesce(new.class_id, old.class_id);
  elsif tg_table_name = 'topic_learning_journeys' then
    select class_id into affected_class_id from public.topics
    where id = coalesce(new.topic_id, old.topic_id);
  elsif tg_table_name = 'editorial_artifacts' then
    affected_class_id := coalesce(new.class_id, old.class_id);
  elsif tg_table_name = 'editorial_artifact_evidence' then
    select class_id into affected_class_id from public.editorial_artifacts
    where id = coalesce(new.artifact_id, old.artifact_id);
  end if;

  if affected_class_id is not null then
    perform private.touch_class_editorial_content(
      affected_class_id,
      'Cambió la evidencia trazable del contenido.'
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.invalidate_class_review_from_evidence()
  from public, anon, authenticated;

create trigger class_evidence_invalidate_review
after insert or update or delete on public.class_evidence
for each row execute function private.invalidate_class_review_from_evidence();
create trigger topic_learning_journeys_invalidate_review
after insert or update or delete on public.topic_learning_journeys
for each row execute function private.invalidate_class_review_from_evidence();
create trigger editorial_artifacts_invalidate_review
after insert or update or delete on public.editorial_artifacts
for each row execute function private.invalidate_class_review_from_evidence();
create trigger editorial_artifact_evidence_invalidate_review
after insert or update or delete on public.editorial_artifact_evidence
for each row execute function private.invalidate_class_review_from_evidence();

create function private.import_class_package_v12(p_package jsonb)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  subject_id bigint;
  v_class_id bigint;
  transcript_id bigint;
  topic_id bigint;
  journey_id bigint;
  material_id bigint;
  map_id bigint;
  card_id bigint;
  exam_id bigint;
  question_id bigint;
  option_id bigint;
  reference_id bigint;
  correct_option_id bigint;
  topic_index integer;
  item_index integer;
  reference_index integer;
  question_index integer;
  option_index integer;
  evidence jsonb;
  topic jsonb;
  item jsonb;
  question jsonb;
  option_ids bigint[];
  option_explanations jsonb;
  v_curriculum_code text;
  v_curriculum_order integer;
begin
  if p_package is null or jsonb_typeof(p_package) <> 'object'
     or p_package ->> 'packageVersion' <> '1.2' then
    raise exception 'Solo se puede importar el contrato editorial 1.2.'
      using errcode = '22023';
  end if;
  if jsonb_typeof(p_package -> 'topics') <> 'array'
     or jsonb_array_length(p_package -> 'topics') = 0
     or jsonb_typeof(p_package -> 'evidenceRegistry') <> 'array'
     or jsonb_array_length(p_package -> 'evidenceRegistry') = 0
     or jsonb_typeof(p_package #> '{curriculum,audioSources}') <> 'array'
     or jsonb_array_length(p_package #> '{curriculum,audioSources}') = 0 then
    raise exception 'El paquete requiere temas, audios y un registro de evidencia.'
      using errcode = '22023';
  end if;

  if (
    select count(*) <> count(distinct entry ->> 'id')
    from jsonb_array_elements(p_package -> 'evidenceRegistry') entry
  ) then
    raise exception 'El registro de evidencia contiene IDs duplicados.'
      using errcode = '23505';
  end if;

  v_curriculum_code := p_package #>> '{curriculum,code}';
  v_curriculum_order := (p_package #>> '{curriculum,order}')::integer;
  if v_curriculum_code !~ '^C(0[1-9]|[1-4][0-9]|5[0-8])$'
     or v_curriculum_order <> substring(v_curriculum_code from 2)::integer then
    raise exception 'El código y orden curriculares no son válidos.'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ceneval-import:' || v_curriculum_code, 0)
  );
  if exists (
    select 1 from public.classes class_row
    where class_row.curriculum_code = v_curriculum_code
       or class_row.curriculum_order = v_curriculum_order
  ) then
    raise exception 'El código u orden curricular ya están asignados.'
      using errcode = '23505';
  end if;

  select id into subject_id from public.subjects
  where lower(name) = lower(p_package #>> '{subject,name}')
  order by id limit 1;
  if subject_id is null then
    insert into public.subjects (name, description)
    values (
      p_package #>> '{subject,name}',
      nullif(p_package #>> '{subject,description}', '')
    ) returning id into subject_id;
  end if;

  insert into public.classes (
    subject_id, title, class_date, teacher, description,
    publication_status, curriculum_code, curriculum_order
  ) values (
    subject_id,
    p_package #>> '{class,title}',
    nullif(p_package #>> '{class,date}', '')::date,
    nullif(p_package #>> '{class,teacher}', ''),
    nullif(p_package #>> '{class,description}', ''),
    'draft', v_curriculum_code, v_curriculum_order
  ) returning id into v_class_id;

  for item_index in 0..jsonb_array_length(p_package #> '{curriculum,audioSources}') - 1 loop
    item := p_package #> array['curriculum', 'audioSources', item_index::text];
    insert into public.class_audio_sources (
      class_id, audio_number, fragment, position
    ) values (
      v_class_id, (item ->> 'audioNumber')::integer,
      item ->> 'fragment', item_index + 1
    );
  end loop;

  insert into public.transcripts (
    class_id, original_text, cleaned_text, processing_status
  ) values (
    v_class_id, p_package #>> '{transcript,original}',
    p_package #>> '{transcript,cleaned}', 'ready'
  ) returning id into transcript_id;

  for evidence in select value from jsonb_array_elements(p_package -> 'evidenceRegistry') loop
    insert into public.class_evidence (
      class_id, evidence_key, evidence_kind, audio_number, locator,
      title, url, institution, jurisdiction, retrieved_on, verified_on
    ) values (
      v_class_id, evidence ->> 'id', evidence ->> 'kind',
      case when evidence ->> 'kind' = 'transcript'
        then (evidence ->> 'audioNumber')::integer end,
      case when evidence ->> 'kind' = 'transcript'
        then evidence -> 'locator' else to_jsonb(evidence ->> 'locator') end,
      evidence ->> 'title', evidence ->> 'url', evidence ->> 'institution',
      evidence ->> 'jurisdiction',
      nullif(evidence ->> 'retrievedOn', '')::date,
      nullif(evidence ->> 'verifiedOn', '')::date
    );
  end loop;

  for topic_index in 0..jsonb_array_length(p_package -> 'topics') - 1 loop
    topic := p_package #> array['topics', topic_index::text];
    insert into public.topics (
      class_id, title, description, position, source_type, approval_status
    ) values (
      v_class_id, topic ->> 'title', topic ->> 'description', topic_index + 1,
      'generated', 'pending'
    ) returning id into topic_id;

    insert into public.topic_learning_journeys (topic_id, content)
    values (topic_id, topic -> 'learningJourney') returning id into journey_id;

    perform private.link_artifact_evidence(v_class_id, topic_id,
      'learning_prompt', 'learning_journey', journey_id, 'openingPrompt', null,
      format('topics.%s.learningJourney.openingPrompt', topic_index),
      topic #> '{learningJourney,openingPromptEvidenceIds}');
    for item_index in 0..jsonb_array_length(topic #> '{learningJourney,quickChecks}') - 1 loop
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'quick_check', 'learning_journey', journey_id, 'quickChecks', item_index,
        format('topics.%s.learningJourney.quickChecks.%s', topic_index, item_index),
        topic #> array['learningJourney','quickChecks',item_index::text,'evidenceIds']);
    end loop;
    perform private.link_artifact_evidence(v_class_id, topic_id,
      'practical_case', 'learning_journey', journey_id, 'practicalCase', null,
      format('topics.%s.learningJourney.practicalCase', topic_index),
      topic #> '{learningJourney,practicalCase,evidenceIds}');
    perform private.link_artifact_evidence(v_class_id, topic_id,
      'learning_prompt', 'learning_journey', journey_id, 'closingPrompt', null,
      format('topics.%s.learningJourney.closingPrompt', topic_index),
      topic #> '{learningJourney,closingPromptEvidenceIds}');
    perform private.link_artifact_evidence(v_class_id, topic_id,
      'learning_prompt', 'learning_journey', journey_id, 'nextActivity', null,
      format('topics.%s.learningJourney.nextActivity', topic_index),
      topic #> '{learningJourney,nextActivityEvidenceIds}');

    for item_index in 0..jsonb_array_length(topic -> 'materials') - 1 loop
      item := topic #> array['materials', item_index::text];
      insert into public.study_materials (
        topic_id, material_type, title, content, source_origin,
        source_transcript_id
      ) values (
        topic_id, item ->> 'type', item ->> 'title', item ->> 'content',
        item ->> 'sourceOrigin', transcript_id
      ) returning id into material_id;
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'material', 'study_material', material_id, item ->> 'type', null,
        format('topics.%s.materials.%s', topic_index, item_index),
        item -> 'evidenceIds');
    end loop;

    insert into public.concept_maps (topic_id, title, description, nodes)
    values (
      topic_id, topic #>> '{conceptMap,title}',
      topic #>> '{conceptMap,description}', topic #> '{conceptMap,nodes}'
    ) returning id into map_id;
    for item_index in 0..jsonb_array_length(topic #> '{conceptMap,nodes}') - 1 loop
      item := topic #> array['conceptMap','nodes',item_index::text];
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'concept_map_node', 'concept_map', map_id, 'node', item_index,
        format('topics.%s.conceptMap.nodes.%s', topic_index, item_index),
        item -> 'evidenceIds');
    end loop;

    reference_index := 0;
    for item in select value from jsonb_array_elements(topic -> 'references') loop
      insert into public.legal_references (
        title, url, institution, jurisdiction, citation, retrieved_on
      ) values (
        item ->> 'title', item ->> 'url', item ->> 'institution',
        item ->> 'jurisdiction', coalesce(item ->> 'citation', ''),
        (item ->> 'retrievedOn')::date
      ) on conflict (url, citation) do update set
        title = excluded.title,
        institution = excluded.institution,
        jurisdiction = excluded.jurisdiction,
        retrieved_on = excluded.retrieved_on
      returning id into reference_id;
      insert into public.topic_references (topic_id, reference_id, note, position)
      values (
        topic_id, reference_id, nullif(item ->> 'note', ''), reference_index + 1
      );
      reference_index := reference_index + 1;
    end loop;

    for item_index in 0..jsonb_array_length(topic -> 'flashcards') - 1 loop
      item := topic #> array['flashcards', item_index::text];
      insert into public.flashcards (
        topic_id, question, answer, position, source_origin
      ) values (
        topic_id, item ->> 'question', item ->> 'answer', item_index + 1,
        item ->> 'sourceOrigin'
      ) returning id into card_id;
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'flashcard', 'flashcard', card_id, 'card', null,
        format('topics.%s.flashcards.%s', topic_index, item_index),
        item -> 'evidenceIds');
    end loop;

    insert into public.exams (topic_id, title, description)
    values (topic_id, topic #>> '{exam,title}', topic #>> '{exam,description}')
    returning id into exam_id;

    for question_index in 0..jsonb_array_length(topic #> '{exam,questions}') - 1 loop
      question := topic #> array['exam','questions',question_index::text];
      insert into public.exam_questions (
        exam_id, question_text, difficulty, position
      ) values (
        exam_id, question ->> 'text', question ->> 'difficulty',
        question_index + 1
      ) returning id into question_id;

      perform private.link_artifact_evidence(v_class_id, topic_id,
        'exam_question', 'exam_question', question_id, 'question', null,
        format('topics.%s.exam.questions.%s.text', topic_index, question_index),
        question -> 'evidenceIds');
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'correct_option', 'exam_question', question_id, 'correctOption', null,
        format('topics.%s.exam.questions.%s.correctOption', topic_index, question_index),
        question -> 'correctOptionEvidenceIds');
      perform private.link_artifact_evidence(v_class_id, topic_id,
        'exam_explanation', 'exam_question', question_id, 'explanation', null,
        format('topics.%s.exam.questions.%s.explanation', topic_index, question_index),
        question -> 'explanationEvidenceIds');

      option_ids := '{}';
      option_explanations := '{}'::jsonb;
      for option_index in 0..jsonb_array_length(question -> 'options') - 1 loop
        insert into public.exam_options (question_id, option_text, position)
        values (
          question_id, question #>> array['options',option_index::text],
          option_index + 1
        ) returning id into option_id;
        option_ids := array_append(option_ids, option_id);
        option_explanations := option_explanations || jsonb_build_object(
          option_id::text,
          question #>> array['optionExplanations',option_index::text]
        );
        perform private.link_artifact_evidence(v_class_id, topic_id,
          'exam_option', 'exam_option', option_id, 'option', option_index,
          format('topics.%s.exam.questions.%s.options.%s',
            topic_index, question_index, option_index),
          question #> array['optionEvidenceIds',option_index::text]);
        perform private.link_artifact_evidence(v_class_id, topic_id,
          'option_explanation', 'exam_option', option_id, 'optionExplanation',
          option_index,
          format('topics.%s.exam.questions.%s.optionExplanations.%s',
            topic_index, question_index, option_index),
          question #> array['optionExplanationEvidenceIds',option_index::text]);
      end loop;
      correct_option_id := option_ids[(question ->> 'correctOption')::integer + 1];
      if correct_option_id is null then
        raise exception 'La opción correcta no pertenece a la pregunta.'
          using errcode = '23514';
      end if;
      insert into public.exam_answer_keys (
        question_id, correct_option_id, explanation, option_explanations
      ) values (
        question_id, correct_option_id, question ->> 'explanation',
        option_explanations
      );
    end loop;
  end loop;

  if exists (
    select 1 from public.class_evidence evidence
    where evidence.class_id = v_class_id
      and not exists (
        select 1 from public.editorial_artifact_evidence link
        where link.evidence_id = evidence.id
      )
  ) then
    raise exception 'El registro contiene evidencia que ningún artefacto utiliza.'
      using errcode = '23514';
  end if;
  if not private.class_has_complete_evidence(v_class_id) then
    raise exception 'La evidencia persistida está incompleta.'
      using errcode = '23514';
  end if;

  return v_class_id;
end;
$$;

revoke all on function private.import_class_package_v12(jsonb)
  from public, anon, authenticated;
grant execute on function private.import_class_package_v12(jsonb)
  to service_role;

create function private.evidence_keys_for_artifact(
  p_source_kind text,
  p_source_id bigint,
  p_component text,
  p_component_index integer default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(to_jsonb(evidence.evidence_key) order by link.position),
    '[]'::jsonb
  )
  from public.editorial_artifacts artifact
  join public.editorial_artifact_evidence link on link.artifact_id = artifact.id
  join public.class_evidence evidence on evidence.id = link.evidence_id
  where artifact.source_kind = p_source_kind
    and artifact.source_id = p_source_id
    and artifact.component = p_component
    and artifact.component_index is not distinct from p_component_index;
$$;

revoke all on function private.evidence_keys_for_artifact(
  text, bigint, text, integer
) from public, anon, authenticated;
grant execute on function private.evidence_keys_for_artifact(
  text, bigint, text, integer
) to service_role;

create function private.export_class_package_v12(p_class_id bigint)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  exported_package jsonb;
begin
  if not exists (select 1 from public.classes where id = p_class_id) then
    raise exception 'La clase solicitada no existe.' using errcode = 'P0002';
  end if;
  if not private.class_has_complete_evidence(p_class_id) then
    raise exception 'La clase no contiene un paquete 1.2 completo.'
      using errcode = '23514';
  end if;

  select jsonb_build_object(
    'packageVersion', '1.2',
    'curriculum', jsonb_build_object(
      'code', class_row.curriculum_code,
      'order', class_row.curriculum_order,
      'audioSources', (
        select jsonb_agg(jsonb_build_object(
          'audioNumber', source.audio_number,
          'fragment', source.fragment
        ) order by source.position)
        from public.class_audio_sources source
        where source.class_id = class_row.id
      )
    ),
    'subject', jsonb_build_object(
      'name', subject.name,
      'description', coalesce(subject.description, '')
    ),
    'class', jsonb_strip_nulls(jsonb_build_object(
      'title', class_row.title,
      'date', to_char(class_row.class_date, 'YYYY-MM-DD'),
      'teacher', class_row.teacher,
      'description', coalesce(class_row.description, '')
    )),
    'transcript', jsonb_build_object(
      'original', transcript.original_text,
      'cleaned', transcript.cleaned_text
    ),
    'topics', (
      select jsonb_agg(jsonb_build_object(
        'title', topic.title,
        'description', topic.description,
        'learningJourney', (
          select jsonb_build_object(
            'openingPrompt', journey.content ->> 'openingPrompt',
            'openingPromptEvidenceIds', private.evidence_keys_for_artifact(
              'learning_journey', journey.id, 'openingPrompt', null
            ),
            'quickChecks', (
              select jsonb_agg(
                (quick_check.value - 'evidenceIds') || jsonb_build_object(
                  'evidenceIds', private.evidence_keys_for_artifact(
                    'learning_journey', journey.id, 'quickChecks',
                    (quick_check.ordinality - 1)::integer
                  )
                ) order by quick_check.ordinality
              )
              from jsonb_array_elements(journey.content -> 'quickChecks')
                with ordinality quick_check(value, ordinality)
            ),
            'practicalCase',
              ((journey.content -> 'practicalCase') - 'evidenceIds')
              || jsonb_build_object(
                'evidenceIds', private.evidence_keys_for_artifact(
                  'learning_journey', journey.id, 'practicalCase', null
                )
              ),
            'closingPrompt', journey.content ->> 'closingPrompt',
            'closingPromptEvidenceIds', private.evidence_keys_for_artifact(
              'learning_journey', journey.id, 'closingPrompt', null
            ),
            'nextActivity', journey.content ->> 'nextActivity',
            'nextActivityEvidenceIds', private.evidence_keys_for_artifact(
              'learning_journey', journey.id, 'nextActivity', null
            )
          )
          from public.topic_learning_journeys journey
          where journey.topic_id = topic.id
        ),
        'materials', (
          select jsonb_agg(jsonb_build_object(
            'type', material.material_type,
            'title', material.title,
            'content', material.content,
            'sourceOrigin', material.source_origin,
            'evidenceIds', private.evidence_keys_for_artifact(
              'study_material', material.id, material.material_type, null
            )
          ) order by material.id)
          from public.study_materials material
          where material.topic_id = topic.id and material.is_current
        ),
        'conceptMap', (
          select jsonb_build_object(
            'title', map.title,
            'description', coalesce(map.description, ''),
            'nodes', (
              select jsonb_agg(
                (node.value - 'evidenceIds') || jsonb_build_object(
                  'evidenceIds', private.evidence_keys_for_artifact(
                    'concept_map', map.id, 'node',
                    (node.ordinality - 1)::integer
                  )
                ) order by node.ordinality
              )
              from jsonb_array_elements(map.nodes)
                with ordinality node(value, ordinality)
            )
          )
          from public.concept_maps map
          where map.topic_id = topic.id and map.is_current
          order by map.version desc limit 1
        ),
        'references', (
          select jsonb_agg(jsonb_build_object(
            'title', reference.title,
            'url', reference.url,
            'institution', reference.institution,
            'jurisdiction', reference.jurisdiction,
            'citation', reference.citation,
            'retrievedOn', to_char(reference.retrieved_on, 'YYYY-MM-DD'),
            'note', coalesce(link.note, '')
          ) order by link.position)
          from public.topic_references link
          join public.legal_references reference on reference.id = link.reference_id
          where link.topic_id = topic.id
        ),
        'flashcards', (
          select jsonb_agg(jsonb_build_object(
            'question', card.question,
            'answer', card.answer,
            'sourceOrigin', card.source_origin,
            'evidenceIds', private.evidence_keys_for_artifact(
              'flashcard', card.id, 'card', null
            )
          ) order by card.position)
          from public.flashcards card where card.topic_id = topic.id
        ),
        'exam', (
          select jsonb_build_object(
            'title', exam.title,
            'description', coalesce(exam.description, ''),
            'questions', (
              select jsonb_agg(jsonb_build_object(
                'text', question.question_text,
                'difficulty', question.difficulty,
                'options', (
                  select jsonb_agg(to_jsonb(option_row.option_text)
                    order by option_row.position)
                  from public.exam_options option_row
                  where option_row.question_id = question.id
                ),
                'correctOption', (
                  select option_row.position - 1
                  from public.exam_options option_row
                  where option_row.id = answer_key.correct_option_id
                ),
                'explanation', answer_key.explanation,
                'optionExplanations', (
                  select jsonb_agg(
                    to_jsonb(answer_key.option_explanations ->> option_row.id::text)
                    order by option_row.position
                  )
                  from public.exam_options option_row
                  where option_row.question_id = question.id
                ),
                'evidenceIds', private.evidence_keys_for_artifact(
                  'exam_question', question.id, 'question', null
                ),
                'optionEvidenceIds', (
                  select jsonb_agg(private.evidence_keys_for_artifact(
                    'exam_option', option_row.id, 'option', option_row.position - 1
                  ) order by option_row.position)
                  from public.exam_options option_row
                  where option_row.question_id = question.id
                ),
                'correctOptionEvidenceIds', private.evidence_keys_for_artifact(
                  'exam_question', question.id, 'correctOption', null
                ),
                'explanationEvidenceIds', private.evidence_keys_for_artifact(
                  'exam_question', question.id, 'explanation', null
                ),
                'optionExplanationEvidenceIds', (
                  select jsonb_agg(private.evidence_keys_for_artifact(
                    'exam_option', option_row.id, 'optionExplanation',
                    option_row.position - 1
                  ) order by option_row.position)
                  from public.exam_options option_row
                  where option_row.question_id = question.id
                )
              ) order by question.position)
              from public.exam_questions question
              join public.exam_answer_keys answer_key
                on answer_key.question_id = question.id
              where question.exam_id = exam.id
            )
          )
          from public.exams exam
          where exam.topic_id = topic.id and exam.is_current
          order by exam.version desc limit 1
        )
      ) order by topic.position)
      from public.topics topic where topic.class_id = class_row.id
    ),
    'evidenceRegistry', (
      select jsonb_agg(
        case when evidence.evidence_kind = 'transcript' then
          jsonb_build_object(
            'id', evidence.evidence_key,
            'kind', evidence.evidence_kind,
            'audioNumber', evidence.audio_number,
            'locator', evidence.locator
          )
        else
          jsonb_build_object(
            'id', evidence.evidence_key,
            'kind', evidence.evidence_kind,
            'title', evidence.title,
            'url', evidence.url,
            'institution', evidence.institution,
            'jurisdiction', evidence.jurisdiction,
            'locator', evidence.locator,
            'retrievedOn', to_char(evidence.retrieved_on, 'YYYY-MM-DD'),
            'verifiedOn', to_char(evidence.verified_on, 'YYYY-MM-DD')
          )
        end order by evidence.evidence_key
      )
      from public.class_evidence evidence
      where evidence.class_id = class_row.id
    )
  ) into exported_package
  from public.classes class_row
  join public.subjects subject on subject.id = class_row.subject_id
  join public.transcripts transcript on transcript.class_id = class_row.id
  where class_row.id = p_class_id;

  if exported_package is null then
    raise exception 'La clase no puede reconstruirse como paquete 1.2.'
      using errcode = '23514';
  end if;
  return exported_package;
end;
$$;

revoke all on function private.export_class_package_v12(bigint)
  from public, anon, authenticated;
grant execute on function private.export_class_package_v12(bigint)
  to service_role;

create function public.import_class_package_v12(p_package jsonb)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select private.import_class_package_v12(p_package);
$$;

revoke all on function public.import_class_package_v12(jsonb)
  from public, anon, authenticated;
grant execute on function public.import_class_package_v12(jsonb)
  to service_role;

create function public.export_class_package_v12(p_class_id bigint)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.export_class_package_v12(p_class_id);
$$;

revoke all on function public.export_class_package_v12(bigint)
  from public, anon, authenticated;
grant execute on function public.export_class_package_v12(bigint)
  to service_role;

-- Replace the previous gate in place; its trigger remains attached to this OID.
create or replace function private.enforce_class_publication_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.publication_status = 'published'
     and old.publication_status is distinct from 'published' then
    if old.publication_status <> 'review' then
      raise exception 'La publicación requiere pasar primero por revisión.'
        using errcode = '23514';
    end if;
    if not exists (select 1 from public.topics where class_id = new.id) then
      raise exception 'La clase no tiene temas.' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.topics
      where class_id = new.id and approval_status <> 'approved'
    ) then
      raise exception 'Todos los temas deben estar aprobados.'
        using errcode = '23514';
    end if;
    if exists (
      select 1 from public.topics topic
      where topic.class_id = new.id
        and (
          (select count(distinct material_type) from public.study_materials
           where topic_id = topic.id and is_current) <> 9
          or (select count(*) from public.concept_maps
              where topic_id = topic.id and is_current) <> 1
          or (select count(*) from public.flashcards
              where topic_id = topic.id) < 10
          or (select count(*) from public.exam_questions
              join public.exams on exams.id = exam_questions.exam_id
              where exams.topic_id = topic.id and exams.is_current) <> 10
        )
    ) then
      raise exception 'Hay temas con materiales incompletos.'
        using errcode = '23514';
    end if;
    if not private.class_has_complete_evidence(new.id) then
      raise exception 'La clase no tiene evidencia trazable completa.'
        using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.class_editorial_reviews review
      where review.class_id = new.id
        and review.verdict = 'approved'
        and review.invalidated_at is null
        and review.legal_verified_on is not null
        and review.content_version = new.content_version
        and review.content_digest = new.content_digest
    ) then
      raise exception 'Falta una revisión editorial vigente para esta versión.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

commit;
