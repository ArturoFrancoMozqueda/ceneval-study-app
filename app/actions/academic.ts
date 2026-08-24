"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import {
  gradeExamSelections,
  parseExamSubmission,
  validateExamSelections,
  type ExamReview,
} from "@/lib/exam-submission";
import {
  parseFlashcardReview,
  parseQuickCheck,
  parseStudyProgress,
} from "@/lib/study-action-input";
import {
  canTransitionPublicationStatus,
  derivePublicationDiagnostics,
  hasCurrentApprovedReview,
  type PublicationReadinessFailure,
} from "@/lib/publication-readiness";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import {
  isPositiveInteger,
  isTopicApprovalStatus,
  topicMutationErrorMessage,
  type TopicApprovalStatus,
} from "@/lib/editorial-actions";

export type ActionResult = {
  error?: string;
  id?: number;
  score?: number;
  total?: number;
  review?: ExamReview[];
  publicationReadiness?: PublicationReadinessFailure;
};

type EditorialVerdict = "approved" | "rejected";

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function databaseError(operation: string, error?: unknown): ActionResult {
  writeDependencyFailure({ error, operation });
  return { error: "No pudimos guardar los cambios. Intenta nuevamente." };
}

function publicationCheckDatabaseError(
  operation: string,
  error?: unknown,
): ActionResult {
  writeDependencyFailure({ error, operation });
  return {
    error:
      "No pudimos comprobar los requisitos de publicación. Actualiza la página e intenta nuevamente.",
  };
}

const studyActivityError =
  "No pudimos guardar esta actividad de estudio. Actualiza la página e intenta nuevamente.";

type AuthenticatedSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

type PublishedTopicCheck =
  | { available: true }
  | { available: false; databaseError?: unknown };

function unavailableStudyActivity(
  operation?: string,
  databaseError?: unknown,
): ActionResult {
  if (operation && databaseError) {
    writeDependencyFailure({ error: databaseError, operation });
  }
  return { error: studyActivityError };
}

async function checkPublishedTopic(
  supabase: AuthenticatedSupabaseClient,
  topicId: number,
): Promise<PublishedTopicCheck> {
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id,class_id")
    .eq("id", topicId)
    .maybeSingle();
  if (topicError) {
    return { available: false, databaseError: topicError };
  }
  if (!topic) return { available: false };

  const { data: studyClass, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("id", topic.class_id)
    .eq("publication_status", "published")
    .maybeSingle();
  if (classError) {
    return { available: false, databaseError: classError };
  }
  return studyClass ? { available: true } : { available: false };
}

export async function createSubjectAction(formData: FormData) {
  await requireAdmin();
  const name = textValue(formData, "name");
  const description = textValue(formData, "description");
  if (!name) return { error: "Escribe el nombre de la materia." };
  if (name.length > 80) return { error: "El nombre es demasiado largo." };
  if (description.length > 300) {
    return { error: "La descripción es demasiado larga." };
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("subjects")
    .insert({ name, description: description || null })
    .select("id")
    .single();

  if (error?.code === "23505") {
    return { error: "Ya existe una materia con ese nombre." };
  }
  if (error) return databaseError("createSubject", error);
  revalidatePath("/");
  revalidatePath("/materias");
  revalidatePath("/administrar");
  return { id: data.id as number };
}

export async function createClassAction(
  subjectId: number,
  formData: FormData,
) {
  await requireAdmin();
  const title = textValue(formData, "title");
  const classDate = textValue(formData, "classDate");
  const teacher = textValue(formData, "teacher");
  const description = textValue(formData, "description");

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return { error: "La materia seleccionada no es válida." };
  }
  if (!title) return { error: "Escribe el título de la clase." };
  if (title.length > 120) return { error: "El título es demasiado largo." };
  if (teacher.length > 100 || description.length > 400) {
    return { error: "Revisa la longitud de los campos." };
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("classes")
    .insert({
      subject_id: subjectId,
      title,
      class_date: classDate || null,
      teacher: teacher || null,
      description: description || null,
      publication_status: "draft",
    })
    .select("id")
    .single();

  if (error) return databaseError("createClass", error);
  revalidatePath("/administrar");
  revalidatePath(`/materias/${subjectId}`);
  return { id: data.id as number };
}

export async function updateClassDetailsAction(
  classId: number,
  formData: FormData,
) {
  await requireAdmin();
  const title = textValue(formData, "title");
  const description = textValue(formData, "description");

  if (!Number.isInteger(classId) || classId <= 0) {
    return { error: "La clase seleccionada no es válida." };
  }
  if (!title) return { error: "Escribe el título de la clase." };
  if (title.length > 120) {
    return { error: "El título no puede superar 120 caracteres." };
  }
  if (description.length > 400) {
    return { error: "La descripción no puede superar 400 caracteres." };
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("classes")
    .update({
      title,
      description: description || null,
    })
    .eq("id", classId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError("updateClassDetails", error);
  if (!data) return { error: "No encontramos la clase que quieres editar." };

  revalidatePath("/");
  revalidatePath("/materias");
  revalidatePath("/administrar");
  revalidatePath(`/administrar/clases/${classId}`);
  revalidatePath(`/clases/${classId}`);
  return { id: data.id as number };
}

export type ExamQuestionForEdit = {
  id: number;
  position: number;
  questionText: string;
  difficulty: "basic" | "intermediate" | "advanced";
  options: { id: number; position: number; text: string }[];
  correctOptionId: number;
  explanation: string;
  optionExplanations: Record<string, string>;
};

export async function getExamQuestionsForEdit(
  topicId: number,
): Promise<ExamQuestionForEdit[] | null> {
  await requireAdmin();
  if (!isPositiveInteger(topicId)) return null;

  const admin = getSupabaseAdminClient();
  const { data: exam, error: examError } = await admin
    .from("exams")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_current", true)
    .maybeSingle();
  if (examError || !exam) return null;

  const { data: questions, error: questionsError } = await admin
    .from("exam_questions")
    .select("id,position,question_text,difficulty")
    .eq("exam_id", exam.id)
    .order("position");
  if (questionsError || !questions?.length) return null;

  const questionIds = questions.map((question) => question.id as number);
  const [{ data: options, error: optionsError }, { data: keys, error: keysError }] =
    await Promise.all([
      admin
        .from("exam_options")
        .select("id,question_id,position,option_text")
        .in("question_id", questionIds)
        .order("position"),
      admin
        .from("exam_answer_keys")
        .select("question_id,correct_option_id,explanation,option_explanations")
        .in("question_id", questionIds),
    ]);
  if (optionsError || keysError) return null;

  const optionsByQuestion = new Map<
    number,
    { id: number; position: number; text: string }[]
  >();
  for (const option of options ?? []) {
    const questionId = option.question_id as number;
    const list = optionsByQuestion.get(questionId) ?? [];
    list.push({
      id: option.id as number,
      position: option.position as number,
      text: option.option_text as string,
    });
    optionsByQuestion.set(questionId, list);
  }

  const keysByQuestion = new Map(
    (keys ?? []).map((key) => [key.question_id as number, key]),
  );

  return questions.map((question) => {
    const questionId = question.id as number;
    const key = keysByQuestion.get(questionId);
    return {
      id: questionId,
      position: question.position as number,
      questionText: question.question_text as string,
      difficulty: question.difficulty as ExamQuestionForEdit["difficulty"],
      options: (optionsByQuestion.get(questionId) ?? []).sort(
        (a, b) => a.position - b.position,
      ),
      correctOptionId: (key?.correct_option_id as number) ?? 0,
      explanation: (key?.explanation as string) ?? "",
      optionExplanations:
        (key?.option_explanations as Record<string, string>) ?? {},
    };
  });
}

export async function updateExamQuestionAction(
  classId: number,
  topicId: number,
  questionId: number,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  if (
    !isPositiveInteger(classId) ||
    !isPositiveInteger(topicId) ||
    !isPositiveInteger(questionId)
  ) {
    return { error: "La pregunta seleccionada no es válida." };
  }

  const questionText = textValue(formData, "questionText");
  const difficulty = textValue(formData, "difficulty");
  const option1 = textValue(formData, "option1");
  const option2 = textValue(formData, "option2");
  const option3 = textValue(formData, "option3");
  const correctPosition = Number(textValue(formData, "correctPosition"));
  const explanation = textValue(formData, "explanation");
  const explanation1 = textValue(formData, "explanation1");
  const explanation2 = textValue(formData, "explanation2");
  const explanation3 = textValue(formData, "explanation3");

  if (!questionText || questionText.length > 600) {
    return {
      error: "El texto de la pregunta debe medir entre 1 y 600 caracteres.",
    };
  }
  if (!["basic", "intermediate", "advanced"].includes(difficulty)) {
    return { error: "Elige un nivel de dificultad válido." };
  }
  if (!option1 || !option2 || !option3) {
    return { error: "Escribe las tres opciones." };
  }
  if (![1, 2, 3].includes(correctPosition)) {
    return { error: "Elige cuál opción es la correcta." };
  }
  if (!explanation || !explanation1 || !explanation2 || !explanation3) {
    return {
      error:
        "Completa la explicación general y las tres explicaciones de opción.",
    };
  }

  const { error } = await getSupabaseAdminClient().rpc(
    "update_exam_question_v1",
    {
      p_question_id: questionId,
      p_question_text: questionText,
      p_difficulty: difficulty,
      p_option_1: option1,
      p_option_2: option2,
      p_option_3: option3,
      p_correct_position: correctPosition,
      p_explanation: explanation,
      p_explanation_1: explanation1,
      p_explanation_2: explanation2,
      p_explanation_3: explanation3,
    },
  );
  if (error) return databaseError("updateExamQuestion", error);

  revalidatePath(`/administrar/clases/${classId}`);
  revalidatePath(`/administrar/clases/${classId}/temas/${topicId}/examen`);
  revalidatePath(`/temas/${topicId}`);
  revalidatePath(`/clases/${classId}`);
  return { id: questionId };
}

export async function createTopicAction(
  classId: number,
  formData: FormData,
) {
  await requireAdmin();
  if (!isPositiveInteger(classId)) {
    return { error: "La clase seleccionada no es válida." };
  }

  const title = textValue(formData, "title");
  const description = textValue(formData, "description");
  if (!title) return { error: "Escribe el nombre del tema." };
  if (title.length > 120 || description.length > 400) {
    return { error: "Revisa la longitud de los campos." };
  }

  const { data, error } = await getSupabaseAdminClient().rpc(
    "create_topic_with_next_position",
    {
      p_class_id: classId,
      p_title: title,
      p_description: description || null,
    },
  );

  if (error) {
    writeDependencyFailure({ error, operation: "createTopic" });
    return { error: topicMutationErrorMessage(error.code) };
  }
  if (!isPositiveInteger(data)) {
    return databaseError(
      "createTopic",
      "The atomic topic insert did not return a valid identifier.",
    );
  }
  revalidatePath(`/clases/${classId}`);
  revalidatePath(`/clases/${classId}/temas`);
  return { id: data };
}

export async function updateTopicStatusAction(
  topicId: number,
  classId: number,
  status: TopicApprovalStatus,
) {
  await requireAdmin();
  if (!isPositiveInteger(topicId) || !isPositiveInteger(classId)) {
    return { error: "El tema o la clase seleccionada no son válidos." };
  }
  if (!isTopicApprovalStatus(status)) {
    return { error: "El estado editorial seleccionado no es válido." };
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("topics")
    .update({ approval_status: status })
    .eq("id", topicId)
    .eq("class_id", classId)
    .select("id")
    .maybeSingle();
  if (error) {
    writeDependencyFailure({ error, operation: "updateTopicStatus" });
    return { error: topicMutationErrorMessage(error.code) };
  }
  if (!data) {
    return { error: "El tema ya no existe en esta clase. Actualiza la página." };
  }
  revalidatePath(`/clases/${classId}/temas`);
  revalidatePath(`/temas/${topicId}`);
  return { id: topicId };
}

export async function updatePublicationStatusAction(
  classId: number,
  status: "draft" | "review" | "published" | "withdrawn",
): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(classId) || classId <= 0) {
    return { error: "La clase seleccionada no es válida." };
  }
  if (
    !(["draft", "review", "published", "withdrawn"] as const).includes(status)
  ) {
    return { error: "El estado de publicación no es válido." };
  }

  const admin = getSupabaseAdminClient();
  const { data: studyClass, error: classError } = await admin
    .from("classes")
    .select("id,publication_status")
    .eq("id", classId)
    .maybeSingle();
  if (classError) {
    return databaseError("loadClassPublicationStatus", classError);
  }
  if (!studyClass) {
    return { error: "No encontramos la clase que quieres editar." };
  }
  if (studyClass.publication_status === status) return { id: classId };

  if (!canTransitionPublicationStatus(studyClass.publication_status, status)) {
    return {
      error:
        status === "published"
          ? "Primero envía la clase a revisión; no se puede publicar directamente desde borrador."
          : "Ese cambio no pertenece al flujo editorial permitido.",
    };
  }

  if (status === "published") {
    const topics = await admin
      .from("topics")
      .select("id,title,approval_status")
      .eq("class_id", classId)
      .order("position", { ascending: true });
    if (topics.error) {
      return publicationCheckDatabaseError(
        "loadApprovedTopicsForPublication",
        topics.error,
      );
    }

    const allTopics = (topics.data ?? []).map(
      ({ id, title, approval_status }) => ({
      id: id as number,
      title: title as string,
        status: String(approval_status ?? "pending"),
      }),
    );
    if (allTopics.length === 0) {
      return {
        error: "La clase no tiene temas para publicar.",
        publicationReadiness: { reason: "no-topics" },
      };
    }

    const unapprovedTopics = allTopics.filter(
      ({ status: topicStatus }) => topicStatus !== "approved",
    );
    if (unapprovedTopics.length > 0) {
      return {
        error: "Todos los temas deben estar aprobados antes de publicar.",
        publicationReadiness: {
          reason: "unapproved-topics",
          topics: unapprovedTopics.map(({ id, title, status: topicStatus }) => ({
            topicId: id,
            topicTitle: title,
            status: topicStatus,
          })),
        },
      };
    }

    const topicIds = allTopics.map(({ id }) => id);
    const [materials, maps, cards, exams, classVersion, review] = await Promise.all([
      admin
        .from("study_materials")
        .select("topic_id,material_type")
        .in("topic_id", topicIds)
        .eq("is_current", true),
      admin
        .from("concept_maps")
        .select("topic_id")
        .in("topic_id", topicIds)
        .eq("is_current", true),
      admin.from("flashcards").select("topic_id").in("topic_id", topicIds),
      admin
        .from("exams")
        .select("id,topic_id,exam_questions(id)")
        .in("topic_id", topicIds)
        .eq("is_current", true),
      admin
        .from("classes")
        .select("content_version,content_digest")
        .eq("id", classId)
        .single(),
      admin
        .from("class_editorial_reviews")
        .select(
          "verdict,content_version,content_digest,legal_verified_on,invalidated_at",
        )
        .eq("class_id", classId)
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const checks = [
      ["loadMaterialsForPublication", materials.error],
      ["loadConceptMapsForPublication", maps.error],
      ["loadFlashcardsForPublication", cards.error],
      ["loadExamsForPublication", exams.error],
      ["loadClassVersionForPublication", classVersion.error],
      ["loadEditorialReviewForPublication", review.error],
    ] as const;
    const failedCheck = checks.find(([, error]) => error);
    if (failedCheck?.[1]) {
      return publicationCheckDatabaseError(
        failedCheck[0],
        failedCheck[1],
      );
    }

    const diagnostics = derivePublicationDiagnostics({
      topics: allTopics,
      materials: materials.data ?? [],
      conceptMaps: maps.data ?? [],
      flashcards: cards.data ?? [],
      exams: exams.data ?? [],
    });
    if (diagnostics.length > 0) {
      return {
        error: "Completa los requisitos indicados antes de publicar la clase.",
        publicationReadiness: {
          reason: "incomplete-topics",
          topics: diagnostics,
        },
      };
    }

    if (
      !classVersion.data ||
      !hasCurrentApprovedReview({
        classVersion: Number(classVersion.data.content_version),
        classDigest: String(classVersion.data.content_digest),
        review: review.data
          ? {
              verdict: String(review.data.verdict),
              contentVersion: Number(review.data.content_version),
              contentDigest: String(review.data.content_digest),
              legalVerifiedOn: review.data.legal_verified_on
                ? String(review.data.legal_verified_on)
                : null,
              invalidatedAt: review.data.invalidated_at
                ? String(review.data.invalidated_at)
                : null,
            }
          : null,
      })
    ) {
      return {
        error:
          "Falta una aprobación editorial vigente que coincida con esta versión del contenido.",
        publicationReadiness: { reason: "missing-current-review" },
      };
    }
  }

  const update: {
    publication_status: typeof status;
    published_at?: string | null;
  } = { publication_status: status };
  if (status === "published") {
    update.published_at = new Date().toISOString();
  } else if (status !== "withdrawn") {
    update.published_at = null;
  }

  const { data: updatedClass, error } = await admin
    .from("classes")
    .update(update)
    .eq("id", classId)
    .eq("publication_status", studyClass.publication_status)
    .select("id")
    .maybeSingle();
  if (error) return databaseError("updatePublicationStatus", error);
  if (!updatedClass) {
    return {
      error:
        "El estado cambió mientras publicabas. Actualiza la página y vuelve a intentarlo.",
    };
  }
  revalidatePath("/");
  revalidatePath("/materias");
  revalidatePath("/administrar");
  revalidatePath(`/clases/${classId}`);
  return { id: classId };
}

export async function recordEditorialReviewAction(
  classId: number,
  verdict: EditorialVerdict,
  legalVerifiedOn: string,
  notes: string,
): Promise<ActionResult> {
  const reviewer = await requireAdmin();
  if (!isPositiveInteger(classId)) {
    return { error: "La clase seleccionada no es válida." };
  }
  if (!(verdict === "approved" || verdict === "rejected")) {
    return { error: "El dictamen editorial no es válido." };
  }
  const cleanNotes = notes.trim();
  if (cleanNotes.length > 2000) {
    return { error: "Las notas no pueden superar 2000 caracteres." };
  }
  if (verdict === "rejected" && !cleanNotes) {
    return { error: "Explica en las notas qué debe corregirse." };
  }
  if (
    verdict === "approved" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(legalVerifiedOn) ||
      legalVerifiedOn > new Date().toISOString().slice(0, 10))
  ) {
    return {
      error:
        "Indica la fecha real de verificación jurídica; no puede ser futura.",
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: studyClass, error: classError } = await admin
    .from("classes")
    .select("id,publication_status,content_version,content_digest")
    .eq("id", classId)
    .maybeSingle();
  if (classError) return databaseError("loadClassForReview", classError);
  if (!studyClass) return { error: "No encontramos la clase que quieres revisar." };
  if (studyClass.publication_status !== "review") {
    return { error: "La clase debe estar en revisión antes de emitir un dictamen." };
  }

  const { error } = await admin.from("class_editorial_reviews").insert({
    class_id: classId,
    reviewer_id: reviewer.id,
    verdict,
    notes: cleanNotes || null,
    content_version: studyClass.content_version,
    content_digest: studyClass.content_digest,
    legal_verified_on: verdict === "approved" ? legalVerifiedOn : null,
  });
  if (error?.code === "23505") {
    return {
      error:
        "Esta versión ya tiene una aprobación vigente. Actualiza la página.",
    };
  }
  if (error) return databaseError("recordEditorialReview", error);

  revalidatePath(`/administrar/clases/${classId}`);
  revalidatePath(`/clases/${classId}`);
  return { id: classId };
}

export async function reviewFlashcardAction(
  flashcardId: unknown,
  rating: unknown,
) {
  const user = await requireUser();
  const input = parseFlashcardReview({ flashcardId, rating });
  if (!input) return unavailableStudyActivity();

  const supabase = await createServerSupabaseClient();
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("id,topic_id")
    .eq("id", input.flashcardId)
    .maybeSingle();
  if (flashcardError) {
    return unavailableStudyActivity("authorizeFlashcard", flashcardError);
  }
  if (!flashcard) return unavailableStudyActivity();

  const topicCheck = await checkPublishedTopic(
    supabase,
    flashcard.topic_id as number,
  );
  if (!topicCheck.available) {
    return unavailableStudyActivity(
      "authorizeFlashcardTopic",
      topicCheck.databaseError,
    );
  }

  const intervals = { again: 10, hard: 1440, good: 4320, easy: 10080 };
  const nextReview = new Date(
    Date.now() + intervals[input.rating] * 60 * 1000,
  ).toISOString();
  const { error } = await supabase.from("flashcard_reviews").insert({
    user_id: user.id,
    flashcard_id: input.flashcardId,
    rating: input.rating,
    next_review_at: nextReview,
  });
  if (error) return unavailableStudyActivity("reviewFlashcard", error);
  revalidatePath("/estudiar");
  return { id: input.flashcardId };
}

export async function saveStudyProgressAction(rawInput: unknown) {
  const user = await requireUser();
  const input = parseStudyProgress(rawInput);
  if (!input) return unavailableStudyActivity();

  const supabase = await createServerSupabaseClient();
  const topicCheck = await checkPublishedTopic(supabase, input.topicId);
  if (!topicCheck.available) {
    return unavailableStudyActivity(
      "authorizeStudyProgress",
      topicCheck.databaseError,
    );
  }

  const { error } = await supabase.from("study_progress").upsert(
    {
      user_id: user.id,
      topic_id: input.topicId,
      current_step: input.currentStep,
      material_index: input.materialIndex,
      session_minutes: input.sessionMinutes,
      completed_steps: input.completedSteps,
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" },
  );
  if (error) return unavailableStudyActivity("saveStudyProgress", error);
  revalidatePath("/");
  revalidatePath("/estudiar");
  return { id: input.topicId };
}

export async function saveQuickCheckAction(rawInput: unknown) {
  const user = await requireUser();
  const input = parseQuickCheck(rawInput);
  if (!input) return unavailableStudyActivity();

  const supabase = await createServerSupabaseClient();
  const topicCheck = await checkPublishedTopic(supabase, input.topicId);
  if (!topicCheck.available) {
    return unavailableStudyActivity(
      "authorizeQuickCheck",
      topicCheck.databaseError,
    );
  }

  const { error } = await supabase.from("quick_check_responses").insert({
    user_id: user.id,
    topic_id: input.topicId,
    prompt: input.prompt,
    response: input.response,
    needs_review: input.needsReview,
  });
  if (error) return unavailableStudyActivity("saveQuickCheck", error);
  revalidatePath("/estudiar");
  return { id: input.topicId };
}

export async function submitExamAction(
  examId: unknown,
  answers: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const submission = parseExamSubmission(examId, answers);
  if (!submission) {
    return {
      error:
        "Las respuestas enviadas no son válidas. Vuelve a abrir el examen e inténtalo nuevamente.",
    };
  }

  const student = await createServerSupabaseClient();
  const { data: exam, error: examError } = await student
    .from("exams")
    .select("id")
    .eq("id", submission.examId)
    .maybeSingle();
  if (examError || !exam) return { error: "El examen no está disponible." };

  const admin = getSupabaseAdminClient();
  const { data: questions, error: questionsError } = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", submission.examId)
    .order("position");
  if (questionsError || !questions?.length) {
    return { error: "El examen no tiene preguntas disponibles." };
  }

  const questionIds = questions.map(({ id }) => id as number);
  const { data: options, error: optionsError } = await admin
    .from("exam_options")
    .select("id,question_id")
    .in("question_id", questionIds);
  if (optionsError) return databaseError("loadExamOptions", optionsError);

  const optionReferences = (options ?? []).map((option) => ({
    id: option.id as number,
    questionId: option.question_id as number,
  }));
  const selectionValidation = validateExamSelections(
    submission.answers,
    questions.map(({ id }) => ({ id: id as number })),
    optionReferences,
  );
  if (!selectionValidation.success && selectionValidation.reason === "incomplete") {
    return { error: "Responde todas las preguntas antes de entregar." };
  }
  if (!selectionValidation.success) {
    return {
      error:
        "Las respuestas no corresponden a este examen. Vuelve a abrirlo e inténtalo nuevamente.",
    };
  }

  const { data: keys, error: keysError } = await admin
    .from("exam_answer_keys")
    .select(
      "question_id,correct_option_id,explanation,option_explanations",
    )
    .in("question_id", questionIds);
  if (keysError || keys?.length !== questionIds.length) {
    return databaseError("gradeExam", keysError);
  }

  const grading = gradeExamSelections(
    selectionValidation.selections,
    optionReferences,
    keys.map((key) => ({
      questionId: key.question_id as number,
      correctOptionId: key.correct_option_id as number,
      explanation: key.explanation,
      optionExplanations: key.option_explanations,
    })),
  );
  if (!grading.success) {
    return databaseError("gradeExam", "invalid answer key data");
  }

  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      exam_id: submission.examId,
      completed_at: new Date().toISOString(),
      score: grading.score,
      total_questions: questionIds.length,
    })
    .select("id")
    .single();
  if (attemptError) return databaseError("createAttempt", attemptError);

  const correctnessByQuestion = new Map(
    grading.review.map(({ questionId, correct }) => [questionId, correct]),
  );
  const { error: answersError } = await admin.from("exam_answers").insert(
    selectionValidation.selections.map((selection) => ({
      attempt_id: attempt.id,
      question_id: selection.questionId,
      selected_option_id: selection.selectedOptionId,
      is_correct: correctnessByQuestion.get(selection.questionId) === true,
    })),
  );
  if (answersError) {
    const { error: cleanupError } = await admin
      .from("exam_attempts")
      .delete()
      .eq("id", attempt.id)
      .eq("user_id", user.id);
    if (cleanupError) {
      writeDependencyFailure({
        error: cleanupError,
        operation: "cleanupExamAttempt",
      });
    }
    return databaseError("saveAnswers", answersError);
  }

  revalidatePath("/");
  revalidatePath("/estudiar");
  return {
    id: attempt.id as number,
    score: grading.score,
    total: questionIds.length,
    review: grading.review,
  };
}
