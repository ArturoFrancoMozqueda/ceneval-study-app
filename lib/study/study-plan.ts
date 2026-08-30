export type StudyPlanInputs = {
  traditionalDueCount: number;
  traditionalDifficultCount: number;
  traditionalNextReviewAt: string | null;
  adaptiveHasHistory: boolean;
  adaptiveDueCount: number;
  adaptiveDifficultCount: number;
  adaptiveNextReviewAt: string | null;
  activeSessionRemaining: number;
};

export type StudyPlanOverview = {
  recommendedCount: number;
  difficultCount: number;
  nextReviewAt: string | null;
  source: "active" | "adaptive" | "traditional" | "new";
};

function earliestTimestamp(...values: Array<string | null>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0] ?? null;
}

export function deriveStudyPlanOverview(
  input: StudyPlanInputs,
): StudyPlanOverview {
  const source = input.activeSessionRemaining
    ? "active"
    : input.adaptiveHasHistory
      ? "adaptive"
      : input.traditionalDueCount
        ? "traditional"
        : "new";
  const recommendedCount = input.activeSessionRemaining
    ? input.activeSessionRemaining
    : input.adaptiveHasHistory
      ? Math.min(5, input.adaptiveDueCount)
      : Math.min(5, input.traditionalDueCount);

  return {
    source,
    recommendedCount,
    difficultCount: input.adaptiveHasHistory
      ? input.adaptiveDifficultCount
      : input.traditionalDifficultCount,
    nextReviewAt: earliestTimestamp(
      input.adaptiveNextReviewAt,
      input.traditionalNextReviewAt,
    ),
  };
}
