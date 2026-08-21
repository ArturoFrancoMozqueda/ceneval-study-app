import "server-only";

import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import {
  deriveExamAttemptDetail,
  deriveExamHistoryPage,
  examHistoryPageSize,
  parseAttemptRef,
  type ExamAnswerRecord,
  type ExamAttemptRecord,
  type ExamHistoryMetadata,
  type ExamOptionRecord,
  type ExamQuestionRecord,
} from "@/lib/study/exam-history";

function fail(operation: string, error?: unknown): never {
  writeDependencyFailure({ error, operation });
  throw new Error("No pudimos consultar tu historial. Intenta nuevamente.");
}

function oneRelation(value: unknown): Record<string, unknown> | null {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation && typeof relation === "object"
    ? (relation as Record<string, unknown>)
    : null;
}

function toAttempt(row: Record<string, unknown>): ExamAttemptRecord {
  return {
    id: Number(row.id),
    examId: Number(row.exam_id),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    score: row.score === null ? null : Number(row.score),
    totalQuestions:
      row.total_questions === null ? null : Number(row.total_questions),
  };
}

function toMetadata(row: Record<string, unknown>): ExamHistoryMetadata | null {
  const topic = oneRelation(row.topics);
  const studyClass = oneRelation(topic?.classes);
  if (!topic || !studyClass) return null;

  return {
    examId: Number(row.id),
    examTitle: String(row.title),
    isCurrentExam: Boolean(row.is_current),
    topicId: Number(topic.id),
    topicTitle: String(topic.title),
    topicApproved: topic.approval_status === "approved",
    classId: Number(studyClass.id),
    classTitle: String(studyClass.title),
    curriculumCode: studyClass.curriculum_code
      ? String(studyClass.curriculum_code)
      : "",
    classPublished: studyClass.publication_status === "published",
  };
}

async function getExamMetadata(examIds: number[]) {
  if (!examIds.length) return [];

  // The authenticated query establishes ownership first. The server-only
  // client resolves labels for retired versions without exposing their content.
  const { data, error } = await getSupabaseAdminClient()
    .from("exams")
    .select(
      "id,title,is_current,topics!inner(id,title,approval_status,classes!inner(id,title,curriculum_code,publication_status))",
    )
    .in("id", [...new Set(examIds)]);
  if (error) fail("exam history metadata", error);

  return (data ?? []).flatMap((row) => {
    const metadata = toMetadata(row as Record<string, unknown>);
    return metadata ? [metadata] : [];
  });
}

export async function getExamAttemptHistory(cursor?: string) {
  await connection();
  const user = await requireUser();
  const cursorId = cursor ? parseAttemptRef(cursor) : null;
  if (cursor && !cursorId) {
    throw new Error("La página del historial no es válida.");
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("exam_attempts")
    .select("id,exam_id,completed_at,score,total_questions")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .not("score", "is", null)
    .not("total_questions", "is", null)
    .order("id", { ascending: false })
    .limit(examHistoryPageSize + 1);
  if (cursorId) query = query.lt("id", cursorId);

  const { data, error } = await query;
  if (error) fail("exam history attempts", error);
  const attempts = (data ?? []).map((row) =>
    toAttempt(row as Record<string, unknown>),
  );
  const metadata = await getExamMetadata(
    attempts.map((attempt) => attempt.examId),
  );

  return deriveExamHistoryPage(attempts, metadata);
}

export async function getExamAttemptDetail(attemptRef: string) {
  await connection();
  const user = await requireUser();
  const attemptId = parseAttemptRef(attemptRef);
  if (!attemptId) return null;

  const supabase = await createServerSupabaseClient();
  const { data: attemptRow, error: attemptError } = await supabase
    .from("exam_attempts")
    .select("id,exam_id,completed_at,score,total_questions")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (attemptError) fail("exam attempt detail", attemptError);
  if (!attemptRow) return null;

  const attempt = toAttempt(attemptRow as Record<string, unknown>);
  const { data: answerRows, error: answersError } = await supabase
    .from("exam_answers")
    .select(
      "question_id,selected_option_id,is_correct,exam_attempts!inner(user_id)",
    )
    .eq("attempt_id", attemptId)
    .eq("exam_attempts.user_id", user.id);
  if (answersError) fail("exam attempt answers", answersError);

  const answers: ExamAnswerRecord[] = (answerRows ?? []).map((row) => ({
    questionId: Number(row.question_id),
    selectedOptionId: Number(row.selected_option_id),
    isCorrect: Boolean(row.is_correct),
  }));
  const questionIds = answers.map((answer) => answer.questionId);
  const optionIds = answers.map((answer) => answer.selectedOptionId);
  const admin = getSupabaseAdminClient();
  const [metadata, questionsResult, optionsResult] = await Promise.all([
    getExamMetadata([attempt.examId]),
    questionIds.length
      ? admin
          .from("exam_questions")
          .select("id,exam_id,question_text,position")
          .eq("exam_id", attempt.examId)
          .in("id", questionIds)
      : Promise.resolve({ data: [], error: null }),
    optionIds.length
      ? admin
          .from("exam_options")
          .select("id,question_id,option_text")
          .in("id", optionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (questionsResult.error) {
    fail("exam attempt questions", questionsResult.error);
  }
  if (optionsResult.error) {
    fail("exam attempt options", optionsResult.error);
  }

  const questions: ExamQuestionRecord[] = (questionsResult.data ?? []).map(
    (row) => ({
      id: Number(row.id),
      examId: Number(row.exam_id),
      text: String(row.question_text),
      position: Number(row.position),
    }),
  );
  const options: ExamOptionRecord[] = (optionsResult.data ?? []).map((row) => ({
    id: Number(row.id),
    questionId: Number(row.question_id),
    text: String(row.option_text),
  }));
  const detail = deriveExamAttemptDetail(
    attempt,
    metadata[0],
    answers,
    questions,
    options,
  );
  if (!detail) fail("exam attempt detail", "invalid linked attempt data");
  return detail;
}
