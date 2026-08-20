export type FlashcardRating = "again" | "hard" | "good" | "easy";

export type FlashcardReviewRecord = {
  id: number;
  flashcardId: number;
  rating: FlashcardRating;
  reviewedAt: string;
  nextReviewAt: string | null;
};

export type QuickCheckRecord = {
  id: number;
  topicId: number;
  needsReview: boolean;
  answeredAt: string;
};

const ratingPriority: Record<FlashcardRating, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function latestByKey<T extends { id: number }>(
  records: T[],
  getKey: (record: T) => number,
  getDate: (record: T) => string,
) {
  const latest = new Map<number, T>();

  for (const record of records) {
    const key = getKey(record);
    const current = latest.get(key);
    const recordTime = timestamp(getDate(record)) ?? 0;
    const currentTime = current ? timestamp(getDate(current)) ?? 0 : -1;

    if (
      !current ||
      recordTime > currentTime ||
      (recordTime === currentTime && record.id > current.id)
    ) {
      latest.set(key, record);
    }
  }

  return [...latest.values()];
}

export function getLatestFlashcardReviews(records: FlashcardReviewRecord[]) {
  return latestByKey(
    records,
    (record) => record.flashcardId,
    (record) => record.reviewedAt,
  );
}

export function getLatestQuickChecks(records: QuickCheckRecord[]) {
  return latestByKey(
    records,
    (record) => record.topicId,
    (record) => record.answeredAt,
  );
}

export function summarizeFlashcardReviews(
  records: FlashcardReviewRecord[],
  now: Date = new Date(),
) {
  const latest = getLatestFlashcardReviews(records);
  const nowTime = now.getTime();
  const due = latest
    .filter((record) => {
      const dueTime = timestamp(record.nextReviewAt);
      return dueTime === null || dueTime <= nowTime;
    })
    .sort((left, right) => {
      const priority =
        ratingPriority[left.rating] - ratingPriority[right.rating];
      if (priority !== 0) return priority;

      const leftDue = timestamp(left.nextReviewAt) ?? 0;
      const rightDue = timestamp(right.nextReviewAt) ?? 0;
      if (leftDue !== rightDue) return leftDue - rightDue;

      return left.flashcardId - right.flashcardId;
    });
  const futureDates = latest
    .map((record) => timestamp(record.nextReviewAt))
    .filter((value): value is number => value !== null && value > nowTime);

  return {
    latest,
    due,
    currentDifficultCount: latest.filter(
      (record) => record.rating === "again" || record.rating === "hard",
    ).length,
    nextReviewAt: futureDates.length
      ? new Date(Math.min(...futureDates)).toISOString()
      : null,
  };
}
