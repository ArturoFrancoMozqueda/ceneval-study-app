import type { RetrievalScheduleState } from "@/lib/study/adaptive-practice";

export const EXAM_TARGET_HEURISTIC_VERSION =
  "spacing-v1-exam-date-v1" as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function validateFutureExamTargetDate(
  value: string,
  today = new Date(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || isoDay(parsed) !== value) return null;
  return value > isoDay(today) ? value : null;
}

/**
 * Product heuristic, not a scientifically validated prescription or a
 * performance guarantee. spacing-v1 remains the underlying scheduler.
 */
export function applyExamTargetHeuristicV1<T extends RetrievalScheduleState>(
  scheduled: T,
  examTargetDate: string | null,
  reviewedAt: Date,
): T {
  if (!examTargetDate) return scheduled;
  const examAt = new Date(`${examTargetDate}T00:00:00.000Z`);
  if (Number.isNaN(examAt.getTime())) return scheduled;
  const daysRemaining = Math.ceil((examAt.getTime() - reviewedAt.getTime()) / DAY_MS);
  if (daysRemaining <= 0) return scheduled;

  const heuristicCap =
    daysRemaining <= 3
      ? 1
      : daysRemaining <= 7
        ? 3
        : daysRemaining <= 14
          ? 7
          : daysRemaining <= 30
            ? 14
            : 30;
  const scheduledDays = Math.max(
    1,
    Math.ceil((Date.parse(scheduled.nextReviewAt) - reviewedAt.getTime()) / DAY_MS),
  );
  const adjustedDays = Math.min(scheduledDays, heuristicCap);
  if (adjustedDays === scheduledDays) return scheduled;
  return {
    ...scheduled,
    nextReviewAt: new Date(reviewedAt.getTime() + adjustedDays * DAY_MS).toISOString(),
  };
}
