import assert from "node:assert/strict";
import test from "node:test";
import { deriveStudyPlanOverview } from "../lib/study/study-plan";

const base = {
  traditionalDueCount: 4,
  traditionalDifficultCount: 3,
  traditionalNextReviewAt: "2026-09-02T12:00:00.000Z",
  adaptiveHasHistory: false,
  adaptiveDueCount: 0,
  adaptiveDifficultCount: 0,
  adaptiveNextReviewAt: null,
  activeSessionRemaining: 0,
};

test("una ronda activa es la única prioridad visible", () => {
  assert.deepEqual(
    deriveStudyPlanOverview({ ...base, activeSessionRemaining: 3 }),
    {
      source: "active",
      recommendedCount: 3,
      difficultCount: 3,
      nextReviewAt: "2026-09-02T12:00:00.000Z",
    },
  );
});

test("el historial adaptativo sustituye métricas tradicionales sin sumarlas", () => {
  const result = deriveStudyPlanOverview({
    ...base,
    adaptiveHasHistory: true,
    adaptiveDueCount: 2,
    adaptiveDifficultCount: 1,
    adaptiveNextReviewAt: "2026-09-01T12:00:00.000Z",
  });
  assert.equal(result.source, "adaptive");
  assert.equal(result.recommendedCount, 2);
  assert.equal(result.difficultCount, 1);
  assert.equal(result.nextReviewAt, "2026-09-01T12:00:00.000Z");
});

test("sin historial adaptativo conserva un respaldo tradicional acotado", () => {
  const result = deriveStudyPlanOverview({ ...base, traditionalDueCount: 12 });
  assert.equal(result.source, "traditional");
  assert.equal(result.recommendedCount, 5);
});
