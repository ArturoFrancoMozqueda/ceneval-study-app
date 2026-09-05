begin;

-- Permite corregir una pregunta de examen ya publicada (texto, opciones,
-- opción correcta y explicaciones) sin pasar por import_class_package_v12,
-- que solo importa clases nuevas. No toca editorial_artifacts ni
-- editorial_artifact_evidence: los vínculos de evidencia apuntan por
-- question_id/option_id, no por contenido de texto, así que editar el
-- texto de una pregunta ya evidenciada no invalida su evidencia. Los
-- triggers *_invalidate_editorial_review ya existentes se disparan solos
-- con estos UPDATE y marcan la revisión aprobada vigente como obsoleta.
create or replace function private.update_exam_question_v1(
  p_question_id bigint,
  p_question_text text,
  p_difficulty text,
  p_option_1 text,
  p_option_2 text,
  p_option_3 text,
  p_correct_position integer,
  p_explanation text,
  p_explanation_1 text,
  p_explanation_2 text,
  p_explanation_3 text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_option_1_id bigint;
  v_option_2_id bigint;
  v_option_3_id bigint;
  v_correct_option_id bigint;
begin
  if not exists (select 1 from public.exam_questions where id = p_question_id) then
    raise exception 'La pregunta no existe.' using errcode = 'P0002';
  end if;
  if p_difficulty not in ('basic', 'intermediate', 'advanced') then
    raise exception 'La dificultad no es válida.' using errcode = '22023';
  end if;
  if p_correct_position not in (1, 2, 3) then
    raise exception 'La opción correcta debe ser 1, 2 o 3.' using errcode = '22023';
  end if;
  if btrim(coalesce(p_question_text, '')) = ''
     or btrim(coalesce(p_option_1, '')) = ''
     or btrim(coalesce(p_option_2, '')) = ''
     or btrim(coalesce(p_option_3, '')) = ''
     or btrim(coalesce(p_explanation, '')) = ''
     or btrim(coalesce(p_explanation_1, '')) = ''
     or btrim(coalesce(p_explanation_2, '')) = ''
     or btrim(coalesce(p_explanation_3, '')) = '' then
    raise exception 'Ningún texto puede quedar en blanco.' using errcode = '23514';
  end if;

  select id into v_option_1_id from public.exam_options
    where question_id = p_question_id and position = 1;
  select id into v_option_2_id from public.exam_options
    where question_id = p_question_id and position = 2;
  select id into v_option_3_id from public.exam_options
    where question_id = p_question_id and position = 3;
  if v_option_1_id is null or v_option_2_id is null or v_option_3_id is null then
    raise exception 'La pregunta no tiene exactamente 3 opciones.' using errcode = 'P0002';
  end if;

  v_correct_option_id := case p_correct_position
    when 1 then v_option_1_id
    when 2 then v_option_2_id
    when 3 then v_option_3_id
  end;

  update public.exam_questions
  set question_text = p_question_text, difficulty = p_difficulty
  where id = p_question_id;

  update public.exam_options set option_text = p_option_1 where id = v_option_1_id;
  update public.exam_options set option_text = p_option_2 where id = v_option_2_id;
  update public.exam_options set option_text = p_option_3 where id = v_option_3_id;

  update public.exam_answer_keys
  set correct_option_id = v_correct_option_id,
      explanation = p_explanation,
      option_explanations = jsonb_build_object(
        v_option_1_id::text, p_explanation_1,
        v_option_2_id::text, p_explanation_2,
        v_option_3_id::text, p_explanation_3
      )
  where question_id = p_question_id;
end;
$$;

create or replace function public.update_exam_question_v1(
  p_question_id bigint,
  p_question_text text,
  p_difficulty text,
  p_option_1 text,
  p_option_2 text,
  p_option_3 text,
  p_correct_position integer,
  p_explanation text,
  p_explanation_1 text,
  p_explanation_2 text,
  p_explanation_3 text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.update_exam_question_v1(
    p_question_id, p_question_text, p_difficulty,
    p_option_1, p_option_2, p_option_3, p_correct_position,
    p_explanation, p_explanation_1, p_explanation_2, p_explanation_3
  );
end;
$$;

revoke all on function private.update_exam_question_v1(
  bigint, text, text, text, text, text, integer, text, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function private.update_exam_question_v1(
  bigint, text, text, text, text, text, integer, text, text, text, text
) to service_role;

revoke all on function public.update_exam_question_v1(
  bigint, text, text, text, text, text, integer, text, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.update_exam_question_v1(
  bigint, text, text, text, text, text, integer, text, text, text, text
) to service_role;

commit;
