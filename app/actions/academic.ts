"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult = {
  error?: string;
  id?: number;
  score?: number;
  total?: number;
  review?: {
    questionId: number;
    correct: boolean;
    explanation: string;
    optionExplanations: Record<string, string>;
  }[];
};

const studySteps = [
  "discover",
  "understand",
  "apply",
  "remember",
  "check",
] as const;
type StudyStep = (typeof studySteps)[number];

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function databaseError(operation: string, message: string): ActionResult {
  console.error(`[Supabase] ${operation}: ${message}`);
  return { error: "No pudimos guardar los cambios. Intenta nuevamente." };
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
  if (originalText.length < 30) {
    return { error: "Pega una transcripción de al menos 30 caracteres." };
  }
  if (originalText.length > 50000) {
    return { error: "La transcripción supera el límite permitido." };
  }

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
  const title = textValue(formData, "title");
  const description = textValue(formData, "description");
  if (!title) return { error: "Escribe el nombre del tema." };
  if (title.length > 120 || description.length > 400) {
    return { error: "Revisa la longitud de los campos." };
  }

  const admin = getSupabaseAdminClient();
  const { count, error: countError } = await admin
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);
  if (countError) return databaseError("countTopics", countError.message);

  const { data, error } = await admin
    .from("topics")
    .insert({
      class_id: classId,
      title,
      description: description || null,
      position: (count ?? 0) + 1,
      source_type: "manual",
      approval_status: "approved",
    })
    .select("id")
    .single();

  if (error) return databaseError("createTopic", error.message);
  revalidatePath(`/clases/${classId}`);
  revalidatePath(`/clases/${classId}/temas`);
  return { id: data.id as number };
}

export async function updateTopicStatusAction(
  topicId: number,
  classId: number,
  status: "approved" | "rejected",
) {
  await requireAdmin();
  const { error } = await getSupabaseAdminClient()
    .from("topics")
    .update({ approval_status: status })
    .eq("id", topicId)
    .eq("class_id", classId);
  if (error) return databaseError("updateTopicStatus", error.message);
  revalidatePath(`/clases/${classId}/temas`);
  revalidatePath(`/temas/${topicId}`);
  return { id: topicId };
}

export async function updatePublicationStatusAction(
  classId: number,
  status: "draft" | "review" | "published" | "withdrawn",
) {
  await requireAdmin();
  const admin = getSupabaseAdminClient();

  if (status === "published") {
    const [topics, materials, maps, cards, exams] = await Promise.all([
      admin
        .from("topics")
        .select("id")
        .eq("class_id", classId)
        .eq("approval_status", "approved"),
      admin
        .from("study_materials")
        .select("topic_id,material_type")
        .eq("is_current", true),
      admin.from("concept_maps").select("topic_id").eq("is_current", true),
      admin.from("flashcards").select("topic_id"),
      admin.from("exams").select("topic_id").eq("is_current", true),
    ]);
    const topicIds = new Set((topics.data ?? []).map(({ id }) => id as number));
    const complete = [...topicIds].every((topicId) => {
      const materialTypes = new Set(
        (materials.data ?? [])
          .filter(({ topic_id }) => topic_id === topicId)
          .map(({ material_type }) => material_type),
      );
      return (
        materialTypes.size >= 9 &&
        (maps.data ?? []).some(({ topic_id }) => topic_id === topicId) &&
        (cards.data ?? []).filter(({ topic_id }) => topic_id === topicId).length >=
          10 &&
        (exams.data ?? []).some(({ topic_id }) => topic_id === topicId)
      );
    });
    if (topicIds.size === 0 || !complete) {
      return {
        error:
          "La clase aún no tiene un paquete completo por cada tema aprobado.",
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

  const { error } = await admin
    .from("classes")
    .update(update)
    .eq("id", classId);
  if (error) return databaseError("updatePublicationStatus", error.message);
  revalidatePath("/");
  revalidatePath("/materias");
  revalidatePath("/administrar");
  revalidatePath(`/clases/${classId}`);
  return { id: classId };
}

export async function reviewFlashcardAction(
  flashcardId: number,
  rating: "again" | "hard" | "good" | "easy",
) {
  const user = await requireUser();
  const intervals = { again: 10, hard: 1440, good: 4320, easy: 10080 };
  const nextReview = new Date(
    Date.now() + intervals[rating] * 60 * 1000,
  ).toISOString();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("flashcard_reviews").insert({
    user_id: user.id,
    flashcard_id: flashcardId,
    rating,
    next_review_at: nextReview,
  });
  if (error) return databaseError("reviewFlashcard", error.message);
  revalidatePath("/estudiar");
  return { id: flashcardId };
}

export async function saveStudyProgressAction(input: {
  topicId: number;
  currentStep: StudyStep;
  materialIndex: number;
  sessionMinutes: 5 | 10 | 15;
  completedSteps: StudyStep[];
}) {
  const user = await requireUser();
  if (
    !Number.isInteger(input.topicId) ||
    input.topicId < 1 ||
    !studySteps.includes(input.currentStep) ||
    !Number.isInteger(input.materialIndex) ||
    input.materialIndex < 0 ||
    ![5, 10, 15].includes(input.sessionMinutes) ||
    input.completedSteps.some((step) => !studySteps.includes(step))
  ) {
    return { error: "No pudimos guardar esta posición de estudio." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("study_progress").upsert(
    {
      user_id: user.id,
      topic_id: input.topicId,
      current_step: input.currentStep,
      material_index: input.materialIndex,
      session_minutes: input.sessionMinutes,
      completed_steps: [...new Set(input.completedSteps)],
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" },
  );
  if (error) return databaseError("saveStudyProgress", error.message);
  revalidatePath("/");
  revalidatePath("/estudiar");
  return { id: input.topicId };
}

export async function saveQuickCheckAction(input: {
  topicId: number;
  prompt: string;
  response: string;
  needsReview: boolean;
}) {
  const user = await requireUser();
  const prompt = input.prompt.trim().slice(0, 500);
  const response = input.response.trim().slice(0, 1000);
  if (!Number.isInteger(input.topicId) || input.topicId < 1 || !prompt || !response) {
    return { error: "Selecciona una respuesta antes de continuar." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quick_check_responses").insert({
    user_id: user.id,
    topic_id: input.topicId,
    prompt,
    response,
    needs_review: input.needsReview,
  });
  if (error) return databaseError("saveQuickCheck", error.message);
  revalidatePath("/estudiar");
  return { id: input.topicId };
}

export async function submitExamAction(
  examId: number,
  answers: Record<string, number>,
): Promise<ActionResult> {
  const user = await requireUser();
  const student = await createServerSupabaseClient();
  const { data: exam, error: examError } = await student
    .from("exams")
    .select("id")
    .eq("id", examId)
    .maybeSingle();
  if (examError || !exam) return { error: "El examen no está disponible." };

  const admin = getSupabaseAdminClient();
  const { data: questions, error: questionsError } = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId);
  if (questionsError || !questions?.length) {
    return { error: "El examen no tiene preguntas disponibles." };
  }
  if (questions.some(({ id }) => !answers[String(id)])) {
    return { error: "Responde todas las preguntas antes de entregar." };
  }

  const questionIds = questions.map(({ id }) => id as number);
  const { data: keys, error: keysError } = await admin
    .from("exam_answer_keys")
    .select(
      "question_id,correct_option_id,explanation,option_explanations",
    )
    .in("question_id", questionIds);
  if (keysError || keys?.length !== questionIds.length) {
    return databaseError("gradeExam", keysError?.message ?? "missing keys");
  }

  const score = keys.filter(
    ({ correct_option_id, question_id }) =>
      answers[String(question_id)] === correct_option_id,
  ).length;
  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      exam_id: examId,
      completed_at: new Date().toISOString(),
      score,
      total_questions: questionIds.length,
    })
    .select("id")
    .single();
  if (attemptError) return databaseError("createAttempt", attemptError.message);

  const keyByQuestion = new Map(
    keys.map(({ correct_option_id, question_id }) => [
      question_id as number,
      correct_option_id as number,
    ]),
  );
  const { error: answersError } = await admin.from("exam_answers").insert(
    questionIds.map((questionId) => ({
      attempt_id: attempt.id,
      question_id: questionId,
      selected_option_id: answers[String(questionId)],
      is_correct: answers[String(questionId)] === keyByQuestion.get(questionId),
    })),
  );
  if (answersError) return databaseError("saveAnswers", answersError.message);

  revalidatePath("/");
  revalidatePath("/estudiar");
  return {
    id: attempt.id as number,
    score,
    total: questionIds.length,
    review: keys.map((key) => ({
      questionId: key.question_id as number,
      correct:
        answers[String(key.question_id)] === key.correct_option_id,
      explanation: key.explanation as string,
      optionExplanations: key.option_explanations as Record<string, string>,
    })),
  };
}
