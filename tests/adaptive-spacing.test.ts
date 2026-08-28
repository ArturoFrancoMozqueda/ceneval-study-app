import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialRetrievalState,
  prioritizeDueRetrievalItems,
  scheduleRetrievalReview,
  type RetrievalQueueEntry,
} from "../lib/study/adaptive-practice";

const reviewedAt = new Date("2026-08-28T12:00:00.000Z");

test("spacing-v1 inicia mañana y avanza por intervalos cerrados", () => {
  const initial = createInitialRetrievalState(reviewedAt);
  assert.equal(initial.nextReviewAt, "2026-08-29T12:00:00.000Z");
  const result = scheduleRetrievalReview({
    state: initial,
    confidence: "sure",
    outcome: "correct",
    reviewedAt,
  });
  assert.equal(result.stage, 1);
  assert.equal(result.nextReviewAt, "2026-08-31T12:00:00.000Z");
  assert.equal(result.instruction, "advance");
});

test("no recordar normaliza cualquier autoevaluación a incorrecta", () => {
  const result = scheduleRetrievalReview({
    state: { ...createInitialRetrievalState(reviewedAt), stage: 4, successStreak: 3 },
    confidence: "no_recall",
    outcome: "correct",
    reviewedAt,
  });
  assert.deepEqual(
    {
      stage: result.stage,
      streak: result.successStreak,
      lapses: result.lapseCount,
      outcome: result.lastOutcome,
      next: result.nextReviewAt,
      instruction: result.instruction,
    },
    {
      stage: 0,
      streak: 0,
      lapses: 1,
      outcome: "incorrect",
      next: "2026-08-29T12:00:00.000Z",
      instruction: "retry_in_session",
    },
  );
});

test("parcial retrocede un nivel y vuelve mañana", () => {
  const result = scheduleRetrievalReview({
    state: { ...createInitialRetrievalState(reviewedAt), stage: 3, successStreak: 2 },
    confidence: "unsure",
    outcome: "partial",
    reviewedAt,
  });
  assert.equal(result.stage, 2);
  assert.equal(result.successStreak, 0);
  assert.equal(result.nextReviewAt, "2026-08-29T12:00:00.000Z");
});

test("la cola prioriza errores y evita tres temas iguales si existe alternativa", () => {
  const state = createInitialRetrievalState(new Date("2026-08-20T00:00:00Z"));
  const entries: RetrievalQueueEntry[] = [
    { id: 1, stableCode: "C01-R01", topicId: 10, state: { ...state, lastOutcome: "incorrect" } },
    { id: 2, stableCode: "C01-R02", topicId: 10, state: { ...state, lastOutcome: "incorrect" } },
    { id: 3, stableCode: "C01-R03", topicId: 10, state: { ...state, lastOutcome: "incorrect" } },
    { id: 4, stableCode: "C02-R01", topicId: 20, state: { ...state, lastOutcome: "partial" } },
  ];
  assert.deepEqual(
    prioritizeDueRetrievalItems(entries, reviewedAt).map(({ id }) => id),
    [1, 2, 4, 3],
  );
});
