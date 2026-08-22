create or replace function private.import_class_package_v12(p_package jsonb)
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
  reference_index integer;
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
