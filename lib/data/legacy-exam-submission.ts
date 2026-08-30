import "server-only";

import {
  gradeExamSelections,
  validateExamSelections,
  type ExamReview,
  type ValidatedExamSubmission,
} from "@/lib/exam-submission";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LegacyExamResult = {
  error?: string;
  id?: number;
  score?: number;
  total?: number;
  review?: ExamReview[];
};

function failure(operation: string, error?: unknown): LegacyExamResult {
  writeDependencyFailure({ error, operation });
  return { error: "No pudimos guardar los cambios. Intenta nuevamente." };
}

// Compatibility path for the short deployment window before submit_exam_v1
// is applied remotely. Remove it after the migration is verified in every
// environment; the RPC remains the only target architecture.
export async function submitExamLegacy(
  userId: string,
  submission: ValidatedExamSubmission,
): Promise<LegacyExamResult> {
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
  if (optionsError) return failure("loadLegacyExamOptions", optionsError);

  const optionReferences = (options ?? []).map((option) => ({
    id: option.id as number,
    questionId: option.question_id as number,
  }));
  const selectionValidation = validateExamSelections(
    submission.answers,
    questions.map(({ id }) => ({ id: id as number })),
    optionReferences,
  );
  if (!selectionValidation.success) {
    return selectionValidation.reason === "incomplete"
      ? { error: "Responde todas las preguntas antes de entregar." }
      : {
          error:
            "Las respuestas no corresponden a este examen. Vuelve a abrirlo e inténtalo nuevamente.",
        };
  }

  const { data: keys, error: keysError } = await admin
    .from("exam_answer_keys")
    .select("question_id,correct_option_id,explanation,option_explanations")
    .in("question_id", questionIds);
  if (keysError || keys?.length !== questionIds.length) {
    return failure("gradeLegacyExam", keysError);
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
  if (!grading.success) return failure("gradeLegacyExam", "invalid answer key data");

  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      user_id: userId,
      exam_id: submission.examId,
      completed_at: new Date().toISOString(),
      score: grading.score,
      total_questions: questionIds.length,
    })
    .select("id")
    .single();
  if (attemptError) return failure("createLegacyAttempt", attemptError);

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
      .eq("user_id", userId);
    if (cleanupError) {
      writeDependencyFailure({ error: cleanupError, operation: "cleanupLegacyExamAttempt" });
    }
    return failure("saveLegacyAnswers", answersError);
  }

  return {
    id: attempt.id as number,
    score: grading.score,
    total: questionIds.length,
    review: grading.review,
  };
}
