import "server-only";

import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  deriveSubjectProgress,
  type PublishedTopic,
  type TopicExamAttemptRecord,
  type TopicProgressRecord,
  type TopicQuickCheckRecord,
} from "@/lib/study/subject-progress";

function fail(operation: string, message: string): never {
  console.error(`[Supabase] ${operation}: ${message}`);
  throw new Error("No pudimos consultar tu progreso. Intenta nuevamente.");
}

function oneRelation(value: unknown): Record<string, unknown> | null {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation && typeof relation === "object"
    ? (relation as Record<string, unknown>)
    : null;
}

export async function getSubjectProgressOverview() {
  await connection();
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const [topicsResult, progressResult, checksResult, attemptsResult] =
    await Promise.all([
      supabase
        .from("topics")
        .select(
          "id,title,classes!inner(subject_id,publication_status,subjects!inner(id,name))",
        )
        .eq("approval_status", "approved")
        .eq("classes.publication_status", "published"),
      supabase
        .from("study_progress")
        .select(
          "topic_id,completed_steps,last_activity_at,topics!inner(approval_status,classes!inner(publication_status))",
        )
        .eq("user_id", user.id)
        .eq("topics.approval_status", "approved")
        .eq("topics.classes.publication_status", "published"),
      supabase
        .from("quick_check_responses")
        .select(
          "id,topic_id,needs_review,answered_at,topics!inner(approval_status,classes!inner(publication_status))",
        )
        .eq("user_id", user.id)
        .eq("topics.approval_status", "approved")
        .eq("topics.classes.publication_status", "published")
        .order("answered_at", { ascending: false }),
      supabase
        .from("exam_attempts")
        .select(
          "id,score,total_questions,completed_at,exams!inner(topic_id,is_current,topics!inner(approval_status,classes!inner(publication_status)))",
        )
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .eq("exams.is_current", true)
        .eq("exams.topics.approval_status", "approved")
        .eq("exams.topics.classes.publication_status", "published"),
    ]);

  if (topicsResult.error) fail("subject progress topics", topicsResult.error.message);
  if (progressResult.error) {
    fail("subject progress activity", progressResult.error.message);
  }
  if (checksResult.error) fail("subject progress checks", checksResult.error.message);
  if (attemptsResult.error) {
    fail("subject progress attempts", attemptsResult.error.message);
  }

  const topics: PublishedTopic[] = (topicsResult.data ?? []).flatMap((row) => {
    const studyClass = oneRelation(row.classes);
    const subject = oneRelation(studyClass?.subjects);
    if (!studyClass || !subject) return [];
    return [
      {
        id: Number(row.id),
        title: String(row.title),
        subjectId: Number(subject.id),
        subjectName: String(subject.name),
      },
    ];
  });
  const progress: TopicProgressRecord[] = (progressResult.data ?? []).map(
    (row) => ({
      topicId: Number(row.topic_id),
      completedSteps: Array.isArray(row.completed_steps)
        ? row.completed_steps.map(String)
        : [],
      lastActivityAt: String(row.last_activity_at),
    }),
  );
  const checks: TopicQuickCheckRecord[] = (checksResult.data ?? []).map(
    (row) => ({
      id: Number(row.id),
      topicId: Number(row.topic_id),
      needsReview: Boolean(row.needs_review),
      answeredAt: String(row.answered_at),
    }),
  );
  const attempts: TopicExamAttemptRecord[] = (attemptsResult.data ?? []).flatMap(
    (row) => {
      const exam = oneRelation(row.exams);
      if (!exam) return [];
      return [
        {
          id: Number(row.id),
          topicId: Number(exam.topic_id),
          score: row.score === null ? null : Number(row.score),
          totalQuestions:
            row.total_questions === null ? null : Number(row.total_questions),
          completedAt:
            row.completed_at === null ? null : String(row.completed_at),
        },
      ];
    },
  );

  return deriveSubjectProgress(topics, progress, checks, attempts);
}
