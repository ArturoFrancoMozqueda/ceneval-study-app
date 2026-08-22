import "server-only";

import { connection } from "next/server";
import type { ConceptMapNode, SourceOrigin } from "@/lib/data/academic";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Tema fijo de la muestra gratuita pública (tarea P-3 de
 * `docs/PLAN_ACCION_VENTA.md`).
 *
 * Elegido explícitamente: C01 "Cómo estudiar y resolver el EGEL Plus
 * Derecho", tema "Estructura y estrategia para el EGEL Plus Derecho"
 * (topic_id = 2, class_id = 2, materia "Orientación EGEL Derecho"). Es la
 * primera clase del orden curricular (curriculum_order = 1): no exige
 * conocimiento jurídico previo, orienta sobre cómo usar la biblioteca y
 * presentar el examen, y ya tiene contenido publicado y aprobado (9
 * materiales, 12 flashcards, 1 mapa conceptual) — representa la calidad del
 * contenido sin regalar una clase completa de fondo legal. Verificado por
 * consulta de solo lectura contra el proyecto Supabase remoto "CENEVAL
 * Study App" (`qcseoivljzuxzqeaxfly`) el 22 de agosto de 2026.
 */
export const SAMPLE_TOPIC_ID = 2;

export type SampleMaterial = {
  id: number;
  materialType: string;
  title: string;
  content: string;
  sourceOrigin: SourceOrigin;
};

export type SampleReference = {
  id: number;
  title: string;
  url: string;
  institution: string;
  jurisdiction: string;
  note: string;
};

export type SampleFlashcard = {
  id: number;
  question: string;
  answer: string;
  position: number;
};

export type SampleLesson = {
  topic: { id: number; title: string; description: string };
  studyClass: {
    id: number;
    title: string;
    teacher: string;
    curriculumCode: string;
  };
  subject: { id: number; name: string };
  materials: SampleMaterial[];
  conceptMap: {
    title: string;
    description: string;
    nodes: ConceptMapNode[];
  } | null;
  references: SampleReference[];
  flashcards: SampleFlashcard[];
};

/**
 * Consulta de solo lectura para la muestra gratuita pública.
 *
 * A diferencia del resto de `lib/data/academic.ts`, usa el cliente admin
 * (clave secreta, `server-only`) en vez del cliente anónimo, porque las
 * políticas RLS de lectura de estudio exigen un usuario autenticado (`to
 * authenticated`; ver
 * `supabase/migrations/20260821023330_restrict_reading_to_approved_topics.sql`)
 * y esta ruta es intencionalmente pública, sin sesión. Por eso vuelve a
 * comprobar en la consulta misma que el tema sigue aprobado y la clase
 * publicada, en vez de confiar solo en la constante `SAMPLE_TOPIC_ID`.
 *
 * Por la misma razón, esta función **nunca** debe extenderse para leer
 * `exams`, `exam_questions`, `exam_options` ni `exam_answer_keys`: la
 * muestra pública es solo material de lectura, no un examen calificable
 * (regla dura de `AGENTS.md` y de la tarea P-3 del plan de venta).
 */
export async function getSampleLesson(
  topicId: number,
): Promise<SampleLesson | null> {
  await connection();
  const supabase = getSupabaseAdminClient();

  const { data: topicRow, error: topicError } = await supabase
    .from("topics")
    .select("id,class_id,title,description,approval_status")
    .eq("id", topicId)
    .eq("approval_status", "approved")
    .maybeSingle();
  if (topicError || !topicRow) return null;

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,subject_id,title,teacher,publication_status,curriculum_code")
    .eq("id", topicRow.class_id)
    .eq("publication_status", "published")
    .maybeSingle();
  if (classError || !classRow) return null;

  const { data: subjectRow, error: subjectError } = await supabase
    .from("subjects")
    .select("id,name")
    .eq("id", classRow.subject_id)
    .maybeSingle();
  if (subjectError || !subjectRow) return null;

  const [materialsResult, mapResult, linksResult, cardsResult] =
    await Promise.all([
      supabase
        .from("study_materials")
        .select("id,material_type,title,content,source_origin,version")
        .eq("topic_id", topicId)
        .eq("is_current", true),
      supabase
        .from("concept_maps")
        .select("title,description,nodes")
        .eq("topic_id", topicId)
        .eq("is_current", true)
        .maybeSingle(),
      supabase
        .from("topic_references")
        .select(
          "note,legal_references(id,title,url,institution,jurisdiction)",
        )
        .eq("topic_id", topicId),
      supabase
        .from("flashcards")
        .select("id,question,answer,position")
        .eq("topic_id", topicId)
        .order("position"),
    ]);

  if (
    materialsResult.error ||
    mapResult.error ||
    linksResult.error ||
    cardsResult.error
  ) {
    return null;
  }

  const references = (linksResult.data ?? []).flatMap((link) => {
    const raw = link.legal_references as unknown;
    const reference = Array.isArray(raw) ? raw[0] : raw;
    if (!reference || typeof reference !== "object") return [];
    const row = reference as Record<string, unknown>;
    return [
      {
        id: Number(row.id),
        title: String(row.title),
        url: String(row.url),
        institution: String(row.institution),
        jurisdiction: String(row.jurisdiction),
        note: (link.note as string | null) ?? "",
      },
    ];
  });

  return {
    topic: {
      id: topicRow.id as number,
      title: topicRow.title as string,
      description: (topicRow.description as string | null) ?? "",
    },
    studyClass: {
      id: classRow.id as number,
      title: classRow.title as string,
      teacher: (classRow.teacher as string | null) ?? "",
      curriculumCode: (classRow.curriculum_code as string | null) ?? "",
    },
    subject: {
      id: subjectRow.id as number,
      name: subjectRow.name as string,
    },
    materials: (materialsResult.data ?? []).map((row) => ({
      id: row.id as number,
      materialType: row.material_type as string,
      title: row.title as string,
      content: row.content as string,
      sourceOrigin: row.source_origin as SourceOrigin,
    })),
    conceptMap: mapResult.data
      ? {
          title: mapResult.data.title as string,
          description: (mapResult.data.description as string | null) ?? "",
          nodes: mapResult.data.nodes as unknown as ConceptMapNode[],
        }
      : null,
    references,
    flashcards: (cardsResult.data ?? []).map((row) => ({
      id: row.id as number,
      question: row.question as string,
      answer: row.answer as string,
      position: row.position as number,
    })),
  };
}
