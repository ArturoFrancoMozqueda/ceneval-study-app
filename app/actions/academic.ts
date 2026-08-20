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
  derivePublicationDiagnostics,
  type PublicationReadinessFailure,
} from "@/lib/publication-readiness";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranscriptValidationError } from "@/lib/transcript-validation";
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

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function databaseError(operation: string, message: string): ActionResult {
  console.error(`[Supabase] ${operation}: ${message}`);
  return { error: "No pudimos guardar los cambios. Intenta nuevamente." };
}

function publicationCheckDatabaseError(
  operation: string,
  message: string,
): ActionResult {
  console.error(`[Supabase] ${operation}: ${message}`);
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
  | { available: false; databaseMessage?: string };

function unavailableStudyActivity(
  operation?: string,
  databaseMessage?: string,
): ActionResult {
  if (operation && databaseMessage) {
    console.error(`[Supabase] ${operation}: ${databaseMessage}`);
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
    return { available: false, databaseMessage: topicError.message };
  }
  if (!topic) return { available: false };

  const { data: studyClass, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("id", topic.class_id)
    .eq("publication_status", "published")
    .maybeSingle();
  if (classError) {
    return { available: false, databaseMessage: classError.message };
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
  if (error) return databaseError("createSubject", error.message);
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

  if (error) return databaseError("createClass", error.message);
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

  if (error) return databaseError("updateClassDetails", error.message);
  if (!data) return { error: "No encontramos la clase que quieres editar." };

  revalidatePath("/");
  revalidatePath("/materias");
  revalidatePath("/administrar");
  revalidatePath(`/administrar/clases/${classId}`);
  revalidatePath(`/clases/${classId}`);
  return { id: data.id as number };
}

export async function saveTranscriptAction(
  classId: number,
  formData: FormData,
) {
  await requireAdmin();
  const originalText = textValue(formData, "originalText");
  const validationError = getTranscriptValidationError(originalText);
  if (validationError) return { error: validationError };

  const { data, error } = await getSupabaseAdminClient()
    .from("transcripts")
    .insert({
      class_id: classId,
      original_text: originalText,
      processing_status: "pending",
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    return { error: "Esta clase ya tiene una transcripción original." };
  }
  if (error) return databaseError("saveTranscript", error.message);
  revalidatePath(`/clases/${classId}`);
  revalidatePath(`/clases/${classId}/transcripcion`);
  return { id: data.id as number };
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
    console.error(`[Supabase] createTopic: ${error.message}`);
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
    console.error(`[Supabase] updateTopicStatus: ${error.message}`);
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
    return databaseError("loadClassPublicationStatus", classError.message);
  }
  if (!studyClass) {
    return { error: "No encontramos la clase que quieres editar." };
  }
  if (studyClass.publication_status === status) return { id: classId };

  if (status === "published") {
    const topics = await admin
      .from("topics")
      .select("id,title")
      .eq("class_id", classId)
      .eq("approval_status", "approved")
      .order("position", { ascending: true });
    if (topics.error) {
      return publicationCheckDatabaseError(
        "loadApprovedTopicsForPublication",
        topics.error.message,
      );
    }

    const approvedTopics = (topics.data ?? []).map(({ id, title }) => ({
      id: id as number,
      title: title as string,
    }));
    if (approvedTopics.length === 0) {
      return {
        error: "La clase no tiene temas aprobados para publicar.",
        publicationReadiness: { reason: "no-approved-topics" },
      };
    }

    const topicIds = approvedTopics.map(({ id }) => id);
    const [materials, maps, cards, exams] = await Promise.all([
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
    ]);

    const checks = [
      ["loadMaterialsForPublication", materials.error],
      ["loadConceptMapsForPublication", maps.error],
      ["loadFlashcardsForPublication", cards.error],
      ["loadExamsForPublication", exams.error],
    ] as const;
    const failedCheck = checks.find(([, error]) => error);
    if (failedCheck?.[1]) {
      return publicationCheckDatabaseError(
        failedCheck[0],
        failedCheck[1].message,
      );
    }

    const diagnostics = derivePublicationDiagnostics({
      topics: approvedTopics,
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
  if (error) return databaseError("updatePublicationStatus", error.message);
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
    return unavailableStudyActivity("authorizeFlashcard", flashcardError.message);
  }
  if (!flashcard) return unavailableStudyActivity();

  const topicCheck = await checkPublishedTopic(
    supabase,
    flashcard.topic_id as number,
  );
  if (!topicCheck.available) {
    return unavailableStudyActivity(
      "authorizeFlashcardTopic",
      topicCheck.databaseMessage,
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
  if (error) return unavailableStudyActivity("reviewFlashcard", error.message);
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
      topicCheck.databaseMessage,
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
  if (error) return unavailableStudyActivity("saveStudyProgress", error.message);
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
      topicCheck.databaseMessage,
    );
  }

  const { error } = await supabase.from("quick_check_responses").insert({
    user_id: user.id,
    topic_id: input.topicId,
    prompt: input.prompt,
    response: input.response,
    needs_review: input.needsReview,
  });
  if (error) return unavailableStudyActivity("saveQuickCheck", error.message);
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
  if (optionsError) return databaseError("loadExamOptions", optionsError.message);

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
    return databaseError("gradeExam", keysError?.message ?? "missing keys");
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
  if (attemptError) return databaseError("createAttempt", attemptError.message);

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
      console.error(
        `[Supabase] cleanupExamAttempt: ${cleanupError.message}; attempt=${attempt.id}`,
      );
    }
    return databaseError("saveAnswers", answersError.message);
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
