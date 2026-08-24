begin;

-- Permite corregir una flashcard o el learning journey de un tema ya
-- publicado sin pasar por import_class_package_v12, que solo importa clases
-- nuevas. Replica el patrón de update_exam_question_v1
-- (20260824040500_add_update_exam_question_v1.sql): función en private.*
-- con la lógica real, wrapper delgado en public.*, ambas security invoker
-- con search_path vacío, y ejecución restringida a service_role.
--
-- flashcards no tiene columnas de versión (version/is_current) ni tabla de
-- historial: la corrección es un UPDATE en el lugar sobre la fila existente.
-- topic_learning_journeys tiene topic_id único (una sola fila por tema): la
-- corrección también es un UPDATE en el lugar. Ninguna de las dos toca
-- editorial_artifacts ni editorial_artifact_evidence: esos vínculos apuntan
-- por flashcard_id o por el topic_id de la journey, no por el contenido de
-- texto, así que editar sin cambiar de fila no invalida su evidencia. Los
-- triggers flashcards_invalidate_editorial_review y
-- topic_learning_journeys_invalidate_review ya existentes (
-- 20260821164144_editorial_publication_gate.sql y
-- 20260821203000_persist_traceable_packages.sql) se disparan solos con
-- estos UPDATE y marcan la revisión editorial aprobada como obsoleta sin
-- despublicar la clase.

create or replace function private.update_flashcard_v1(
  p_flashcard_id bigint,
  p_question text,
  p_answer text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.flashcards where id = p_flashcard_id) then
    raise exception 'La flashcard no existe.' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_question, '')) = ''
     or btrim(coalesce(p_answer, '')) = '' then
    raise exception 'La pregunta y la respuesta no pueden quedar en blanco.'
      using errcode = '23514';
  end if;

  update public.flashcards
  set question = p_question, answer = p_answer
  where id = p_flashcard_id;
end;
$$;

create or replace function public.update_flashcard_v1(
  p_flashcard_id bigint,
  p_question text,
  p_answer text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.update_flashcard_v1(p_flashcard_id, p_question, p_answer);
end;
$$;

revoke all on function private.update_flashcard_v1(bigint, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.update_flashcard_v1(bigint, text, text)
  to service_role;

revoke all on function public.update_flashcard_v1(bigint, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.update_flashcard_v1(bigint, text, text)
  to service_role;

create or replace function private.update_topic_learning_journey_v1(
  p_topic_id bigint,
  p_content jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.topics where id = p_topic_id) then
    raise exception 'El tema no existe.' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.topic_learning_journeys where topic_id = p_topic_id
  ) then
    raise exception 'Este tema no tiene un learning journey para editar.'
      using errcode = 'P0002';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'El contenido del learning journey no es válido.'
      using errcode = '22023';
  end if;
  if not (
    p_content ?& array[
      'openingPrompt', 'quickChecks', 'practicalCase',
      'closingPrompt', 'nextActivity'
    ]
  ) then
    raise exception
      'Falta al menos una sección obligatoria del learning journey.'
      using errcode = '23514';
  end if;
  if jsonb_typeof(p_content -> 'quickChecks') <> 'array'
     or jsonb_array_length(p_content -> 'quickChecks') < 2 then
    raise exception 'El learning journey necesita al menos dos quick checks.'
      using errcode = '23514';
  end if;

  update public.topic_learning_journeys
  set content = p_content
  where topic_id = p_topic_id;
end;
$$;

create or replace function public.update_topic_learning_journey_v1(
  p_topic_id bigint,
  p_content jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.update_topic_learning_journey_v1(p_topic_id, p_content);
end;
$$;

revoke all on function private.update_topic_learning_journey_v1(bigint, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function private.update_topic_learning_journey_v1(bigint, jsonb)
  to service_role;

revoke all on function public.update_topic_learning_journey_v1(bigint, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.update_topic_learning_journey_v1(bigint, jsonb)
  to service_role;

commit;
