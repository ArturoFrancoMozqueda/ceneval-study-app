begin;

-- Permite corregir un material de estudio o el mapa conceptual de un tema
-- ya publicado sin pasar por import_class_package_v12, que solo importa
-- clases nuevas. Replica el patrón de update_exam_question_v1
-- (20260824040500_add_update_exam_question_v1.sql) y
-- update_flashcard_v1/update_topic_learning_journey_v1
-- (20260824224000_add_update_flashcard_and_journey_v1.sql): función en
-- private.* con la lógica real, wrapper delgado en public.*, ambas security
-- invoker con search_path vacío, y ejecución restringida a service_role.
--
-- A diferencia de flashcards/exam_questions/journey, study_materials y
-- concept_maps SÍ tienen columnas de versión (version, is_current) y un
-- índice único parcial que exige a lo sumo una fila "actual" por
-- combinación tema+tipo (materiales) o por tema (mapas conceptuales). Por
-- eso aquí el mecanismo es distinto: no se actualiza la fila en el lugar,
-- se desactiva la fila vigente (is_current = false) y se inserta una fila
-- nueva con version = version_actual + 1 e is_current = true, tal como
-- estaba pensado el esquema original (docs/06-database-design.md, sección
-- "Versiones de material").
--
-- Limitación conocida (documentada también en docs/PROJECT_STATUS.md): como
-- aquí se inserta una fila con un id NUEVO, los vínculos de evidencia de la
-- fila vieja en editorial_artifacts/editorial_artifact_evidence (que
-- apuntan por source_id al id viejo) quedan huérfanos: siguen existiendo
-- como historial, pero ya no cuentan para la validación de completitud de
-- evidencia (private.class_has_complete_evidence, definida en
-- 20260821203000_persist_traceable_packages.sql, ya filtra por is_current
-- para materiales y mapas). Tras usar esta función, la clase dejará de
-- pasar esa validación para la fila editada hasta que alguien vuelva a
-- vincular evidencia a la fila nueva — igual que si el material se
-- regenerara por el proceso editorial normal. Esta función no resuelve eso,
-- solo lo documenta: no copia ni crea evidencia nueva para la fila nueva.

create or replace function private.update_study_material_v1(
  p_material_id bigint,
  p_title text,
  p_content text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_topic_id bigint;
  v_material_type text;
  v_is_current boolean;
  v_source_origin text;
  v_generation_version text;
  v_next_version integer;
  v_new_id bigint;
begin
  select topic_id, material_type, is_current, source_origin, generation_version
    into v_topic_id, v_material_type, v_is_current, v_source_origin, v_generation_version
    from public.study_materials
    where id = p_material_id;

  if not found then
    raise exception 'El material no existe.' using errcode = 'P0002';
  end if;
  if not v_is_current then
    raise exception 'Esta versión ya no es la vigente, actualiza la página.'
      using errcode = '23514';
  end if;
  if btrim(coalesce(p_title, '')) = ''
     or btrim(coalesce(p_content, '')) = '' then
    raise exception 'El título y el contenido no pueden quedar en blanco.'
      using errcode = '23514';
  end if;

  select max(version) into v_next_version
    from public.study_materials
    where topic_id = v_topic_id and material_type = v_material_type;
  v_next_version := coalesce(v_next_version, 0) + 1;

  update public.study_materials
  set is_current = false
  where id = p_material_id;

  insert into public.study_materials (
    topic_id, material_type, title, content,
    source_origin, generation_version, version, is_current
  )
  values (
    v_topic_id, v_material_type, p_title, p_content,
    v_source_origin, v_generation_version, v_next_version, true
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

create or replace function public.update_study_material_v1(
  p_material_id bigint,
  p_title text,
  p_content text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_id bigint;
begin
  v_new_id := private.update_study_material_v1(p_material_id, p_title, p_content);
  return v_new_id;
end;
$$;

revoke all on function private.update_study_material_v1(bigint, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.update_study_material_v1(bigint, text, text)
  to service_role;

revoke all on function public.update_study_material_v1(bigint, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.update_study_material_v1(bigint, text, text)
  to service_role;

create or replace function private.update_concept_map_v1(
  p_map_id bigint,
  p_title text,
  p_description text,
  p_nodes jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_topic_id bigint;
  v_is_current boolean;
  v_next_version integer;
  v_new_id bigint;
begin
  select topic_id, is_current into v_topic_id, v_is_current
    from public.concept_maps
    where id = p_map_id;

  if not found then
    raise exception 'El mapa conceptual no existe.' using errcode = 'P0002';
  end if;
  if not v_is_current then
    raise exception 'Esta versión ya no es la vigente, actualiza la página.'
      using errcode = '23514';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'El título no puede quedar en blanco.'
      using errcode = '23514';
  end if;
  if p_nodes is null or jsonb_typeof(p_nodes) <> 'array'
     or jsonb_array_length(p_nodes) < 1 then
    raise exception 'El mapa conceptual necesita al menos un nodo.'
      using errcode = '23514';
  end if;

  select max(version) into v_next_version
    from public.concept_maps
    where topic_id = v_topic_id;
  v_next_version := coalesce(v_next_version, 0) + 1;

  update public.concept_maps
  set is_current = false
  where id = p_map_id;

  insert into public.concept_maps (
    topic_id, title, description, nodes, version, is_current
  )
  values (
    v_topic_id, p_title, nullif(btrim(coalesce(p_description, '')), ''),
    p_nodes, v_next_version, true
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

create or replace function public.update_concept_map_v1(
  p_map_id bigint,
  p_title text,
  p_description text,
  p_nodes jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_id bigint;
begin
  v_new_id := private.update_concept_map_v1(
    p_map_id, p_title, p_description, p_nodes
  );
  return v_new_id;
end;
$$;

revoke all on function private.update_concept_map_v1(bigint, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function private.update_concept_map_v1(bigint, text, text, jsonb)
  to service_role;

revoke all on function public.update_concept_map_v1(bigint, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.update_concept_map_v1(bigint, text, text, jsonb)
  to service_role;

commit;
