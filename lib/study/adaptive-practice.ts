import { z } from "zod";

export const retrievalConfidenceSchema = z.enum([
  "sure",
  "unsure",
  "no_recall",
]);
export const retrievalOutcomeSchema = z.enum([
  "incorrect",
  "partial",
  "correct",
]);
export const retrievalTypeSchema = z.enum([
  "free_recall",
  "cued_recall",
  "recognition",
]);

export type PracticeConfidence = z.infer<typeof retrievalConfidenceSchema>;
export type PracticeOutcome = z.infer<typeof retrievalOutcomeSchema>;
export type RetrievalType = z.infer<typeof retrievalTypeSchema>;
export type RetrievalConfidence = PracticeConfidence;
export type RetrievalOutcome = PracticeOutcome;
export type RetrievalStage = 0 | 1 | 2 | 3 | 4 | 5;

export type PracticeItem = {
  id: number;
  stableCode: string;
  topicId: number;
  prompt: string;
  retrievalType: RetrievalType;
  difficulty: "basic" | "intermediate" | "advanced";
  estimatedSeconds: number;
  objective: string;
};

export type PracticeAnswerKey = {
  requiredPoints: string[];
  acceptableAlternatives: string[];
  commonErrors: string[];
  evidence: Array<{
    code: string;
    label: string;
    href?: string;
    verifiedOn?: string;
  }>;
};

export type PracticeSession = {
  id: string;
  status: "active" | "completed" | "abandoned";
  currentPosition: number;
  targetSize: number;
  items: PracticeItem[];
};

export type RetrievalScheduleState = {
  stage: RetrievalStage;
  successStreak: number;
  lapseCount: number;
  lastConfidence: RetrievalConfidence | null;
  lastOutcome: RetrievalOutcome | null;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  schedulerVersion: "spacing-v1";
};

export type RetrievalReviewInstruction =
  | "retry_in_session"
  | "review_tomorrow"
  | "advance";

export type RetrievalQueueEntry = {
  id: number;
  stableCode: string;
  topicId: number;
  state: RetrievalScheduleState;
};

export const SPACING_V1_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const;

export function createPracticeQueue(itemCount: number) {
  return Array.from({ length: Math.min(5, Math.max(0, itemCount)) }, (_, index) => index);
}

export function insertSingleRetry(
  queue: number[],
  currentIndex: number,
  itemIndex: number,
) {
  const insertionIndex = Math.min(queue.length, currentIndex + 3);
  return [
    ...queue.slice(0, insertionIndex),
    itemIndex,
    ...queue.slice(insertionIndex),
  ];
}

export function ratingForPracticeResult(
  confidence: PracticeConfidence,
  outcome: PracticeOutcome,
): "again" | "hard" | "good" | "easy" {
  if (confidence === "no_recall" || outcome === "incorrect") return "again";
  if (outcome === "partial") return "hard";
  return confidence === "sure" ? "easy" : "good";
}

export function feedbackForPracticeResult(outcome: PracticeOutcome) {
  if (outcome === "incorrect") {
    return "Este error vuelve a aparecer en la sesión y mañana para reforzarlo.";
  }
  if (outcome === "partial") {
    return "Recuperaste una parte; volverás a verla pronto para completar la idea.";
  }
  return "Respuesta consolidada. El siguiente repaso tendrá más separación.";
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function asStage(value: number): RetrievalStage {
  return Math.max(0, Math.min(5, value)) as RetrievalStage;
}

export function createInitialRetrievalState(
  exposedAt: Date,
): RetrievalScheduleState {
  return {
    stage: 0,
    successStreak: 0,
    lapseCount: 0,
    lastConfidence: null,
    lastOutcome: null,
    lastReviewedAt: null,
    nextReviewAt: addDays(exposedAt, 1),
    schedulerVersion: "spacing-v1",
  };
}

export function scheduleRetrievalReview({
  state,
  confidence,
  outcome,
  reviewedAt,
}: {
  state: RetrievalScheduleState;
  confidence: RetrievalConfidence;
  outcome: RetrievalOutcome;
  reviewedAt: Date;
}): RetrievalScheduleState & { instruction: RetrievalReviewInstruction } {
  const normalizedOutcome = confidence === "no_recall" ? "incorrect" : outcome;
  let stage = state.stage;
  let successStreak = state.successStreak;
  let lapseCount = state.lapseCount;
  let intervalDays = 1;
  let instruction: RetrievalReviewInstruction = "review_tomorrow";

  if (normalizedOutcome === "incorrect") {
    stage = 0;
    successStreak = 0;
    lapseCount += 1;
    instruction = "retry_in_session";
  } else if (normalizedOutcome === "partial") {
    stage = asStage(stage - 1);
    successStreak = 0;
  } else if (confidence === "sure") {
    stage = asStage(stage + 1);
    successStreak += 1;
    intervalDays = SPACING_V1_INTERVAL_DAYS[stage];
    instruction = "advance";
  } else {
    successStreak += 1;
    intervalDays = SPACING_V1_INTERVAL_DAYS[stage];
    instruction = stage === 0 ? "review_tomorrow" : "advance";
  }

  return {
    stage,
    successStreak,
    lapseCount,
    lastConfidence: confidence,
    lastOutcome: normalizedOutcome,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: addDays(reviewedAt, intervalDays),
    schedulerVersion: "spacing-v1",
    instruction,
  };
}

function queuePriority(entry: RetrievalQueueEntry) {
  const { lastConfidence, lastOutcome } = entry.state;
  if (lastOutcome === "incorrect") return 0;
  if (lastOutcome === "partial") return 1;
  if (lastConfidence === "unsure" || lastConfidence === "no_recall") return 2;
  if (lastOutcome === null) return 3;
  return 4;
}

export function prioritizeDueRetrievalItems(
  entries: RetrievalQueueEntry[],
  now: Date,
): RetrievalQueueEntry[] {
  const remaining = entries
    .filter((entry) => Date.parse(entry.state.nextReviewAt) <= now.getTime())
    .sort((left, right) => {
      const priority = queuePriority(left) - queuePriority(right);
      if (priority !== 0) return priority;
      const leftReview = Date.parse(left.state.lastReviewedAt ?? "1970-01-01T00:00:00Z");
      const rightReview = Date.parse(right.state.lastReviewedAt ?? "1970-01-01T00:00:00Z");
      if (leftReview !== rightReview) return leftReview - rightReview;
      return left.stableCode.localeCompare(right.stableCode);
    });
  const result: RetrievalQueueEntry[] = [];

  while (remaining.length > 0) {
    const last = result.at(-1);
    const previous = result.at(-2);
    const repeatedTopic = last && previous && last.topicId === previous.topicId;
    const candidateIndex = repeatedTopic
      ? remaining.findIndex((entry) => entry.topicId !== last.topicId)
      : 0;
    const selectedIndex = candidateIndex >= 0 ? candidateIndex : 0;
    result.push(remaining.splice(selectedIndex, 1)[0]!);
  }

  return result;
}
