import assert from "node:assert/strict";
import test from "node:test";
import {
  createPracticeQueue,
  insertSingleRetry,
  ratingForPracticeResult,
} from "../lib/study/adaptive-practice";

test("la sesión inicial limita la carga a cinco preguntas", () => {
  assert.deepEqual(createPracticeQueue(12), [0, 1, 2, 3, 4]);
  assert.deepEqual(createPracticeQueue(3), [0, 1, 2]);
});

test("un error reaparece después de otras dos preguntas", () => {
  assert.deepEqual(insertSingleRetry([0, 1, 2, 3, 4], 0, 0), [0, 1, 2, 0, 3, 4]);
});

test("confianza y autoevaluación se traducen al planificador existente", () => {
  assert.equal(ratingForPracticeResult("sure", "correct"), "easy");
  assert.equal(ratingForPracticeResult("unsure", "correct"), "good");
  assert.equal(ratingForPracticeResult("sure", "partial"), "hard");
  assert.equal(ratingForPracticeResult("no_recall", "correct"), "again");
  assert.equal(ratingForPracticeResult("unsure", "incorrect"), "again");
});
