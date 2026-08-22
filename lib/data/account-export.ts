import "server-only";

import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Personal-data export for account holders (task L-4,
// docs/PLAN_ACCION_VENTA.md). Every query below is scoped to the signed-in
// user's own rows and additionally protected by the "select own" RLS
// policies on each table, so this never reads another student's data.
//
// `exam_answer_keys` is intentionally never queried here: it has RLS with
// no policies at all (deliberate lockout, see AGENTS.md) and must stay
// server-only and ungradeable from the client.

export type AccountExport = {
  exportedAt: string;
  account: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string | null;
    role: string;
    createdAt: string;
    termsAcceptedAt: string | null;
  } | null;
  studyProgress: Array<{
    topicId: number;
    currentStep: string;
    materialIndex: number;
    sessionMinutes: number;
    completedSteps: string[];
    lastActivityAt: string;
  }>;
  quickCheckResponses: Array<{
    id: number;
    topicId: number;
    prompt: string;
    response: string;
    needsReview: boolean;
    answeredAt: string;
  }>;
  flashcardReviews: Array<{
    id: number;
    flashcardId: number;
    rating: string;
    reviewedAt: string;
    nextReviewAt: string | null;
  }>;
  examAttempts: Array<{
    id: number;
    examId: number;
    startedAt: string;
    completedAt: string | null;
    score: number | null;
    totalQuestions: number | null;
    answers: Array<{
      questionId: number;
      selectedOptionId: number;
      isCorrect: boolean;
      createdAt: string;
    }>;
  }>;
};

function fail(operation: string, error?: unknown): never {
  writeDependencyFailure({ error, operation });
  throw new Error("No pudimos preparar tu exportación. Intenta nuevamente.");
}

export async function buildAccountExport(): Promise<AccountExport> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const [
    profileResult,
    progressResult,
    quickCheckResult,
    flashcardReviewResult,
    attemptsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,role,created_at,terms_accepted_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("study_progress")
      .select(
        "topic_id,current_step,material_index,session_minutes,completed_steps,last_activity_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("quick_check_responses")
      .select("id,topic_id,prompt,response,needs_review,answered_at")
      .eq("user_id", user.id),
    supabase
      .from("flashcard_reviews")
      .select("id,flashcard_id,rating,reviewed_at,next_review_at")
      .eq("user_id", user.id),
    supabase
      .from("exam_attempts")
      .select("id,exam_id,started_at,completed_at,score,total_questions")
      .eq("user_id", user.id),
  ]);

  if (profileResult.error) fail("buildAccountExport.profile", profileResult.error);
  if (progressResult.error) fail("buildAccountExport.progress", progressResult.error);
  if (quickCheckResult.error) fail("buildAccountExport.quickCheck", quickCheckResult.error);
  if (flashcardReviewResult.error)
    fail("buildAccountExport.flashcardReviews", flashcardReviewResult.error);
  if (attemptsResult.error) fail("buildAccountExport.attempts", attemptsResult.error);

  const attempts = attemptsResult.data ?? [];
  const attemptIds = attempts.map((attempt) => attempt.id);

  const answersResult = attemptIds.length
    ? await supabase
        .from("exam_answers")
        .select("attempt_id,question_id,selected_option_id,is_correct,created_at")
        .in("attempt_id", attemptIds)
    : { data: [], error: null };

  if (answersResult.error) fail("buildAccountExport.answers", answersResult.error);

  const answersByAttempt = new Map<
    number,
    AccountExport["examAttempts"][number]["answers"]
  >();
  for (const answer of answersResult.data ?? []) {
    const list = answersByAttempt.get(answer.attempt_id) ?? [];
    list.push({
      questionId: answer.question_id,
      selectedOptionId: answer.selected_option_id,
      isCorrect: answer.is_correct,
      createdAt: answer.created_at,
    });
    answersByAttempt.set(answer.attempt_id, list);
  }

  return {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profileResult.data
      ? {
          fullName: profileResult.data.full_name,
          role: profileResult.data.role,
          createdAt: profileResult.data.created_at,
          termsAcceptedAt: profileResult.data.terms_accepted_at,
        }
      : null,
    studyProgress: (progressResult.data ?? []).map((row) => ({
      topicId: row.topic_id,
      currentStep: row.current_step,
      materialIndex: row.material_index,
      sessionMinutes: row.session_minutes,
      completedSteps: row.completed_steps ?? [],
      lastActivityAt: row.last_activity_at,
    })),
    quickCheckResponses: (quickCheckResult.data ?? []).map((row) => ({
      id: row.id,
      topicId: row.topic_id,
      prompt: row.prompt,
      response: row.response,
      needsReview: row.needs_review,
      answeredAt: row.answered_at,
    })),
    flashcardReviews: (flashcardReviewResult.data ?? []).map((row) => ({
      id: row.id,
      flashcardId: row.flashcard_id,
      rating: row.rating,
      reviewedAt: row.reviewed_at,
      nextReviewAt: row.next_review_at,
    })),
    examAttempts: attempts.map((attempt) => ({
      id: attempt.id,
      examId: attempt.exam_id,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      answers: answersByAttempt.get(attempt.id) ?? [],
    })),
  };
}
