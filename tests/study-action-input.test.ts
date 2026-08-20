import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFlashcardReview,
  parseQuickCheck,
  parseStudyProgress,
} from "../lib/study-action-input";

test("la revisión de tarjeta exige un ID y una calificación válidos", () => {
  assert.deepEqual(parseFlashcardReview({ flashcardId: 12, rating: "hard" }), {
    flashcardId: 12,
    rating: "hard",
  });
  assert.equal(parseFlashcardReview({ flashcardId: "12", rating: "hard" }), null);
  assert.equal(parseFlashcardReview({ flashcardId: 12, rating: "other" }), null);
  assert.equal(
    parseFlashcardReview({ flashcardId: 12, rating: "hard", userId: "otro" }),
    null,
  );
});

test("el progreso rechaza formas inválidas y elimina pasos duplicados", () => {
  assert.deepEqual(
    parseStudyProgress({
      topicId: 9,
      currentStep: "apply",
      materialIndex: 2,
      sessionMinutes: 10,
      completedSteps: ["discover", "discover", "understand"],
    }),
    {
      topicId: 9,
      currentStep: "apply",
      materialIndex: 2,
      sessionMinutes: 10,
      completedSteps: ["discover", "understand"],
    },
  );
  assert.equal(
    parseStudyProgress({
      topicId: 9,
      currentStep: "apply",
      materialIndex: -1,
      sessionMinutes: 10,
      completedSteps: [],
    }),
    null,
  );
  assert.equal(parseStudyProgress(null), null);
});

test("la comprobación rápida normaliza texto y aplica límites", () => {
  assert.deepEqual(
    parseQuickCheck({
      topicId: 3,
      prompt: "  Pregunta  ",
      response: "  Respuesta  ",
      needsReview: false,
    }),
    {
      topicId: 3,
      prompt: "Pregunta",
      response: "Respuesta",
      needsReview: false,
    },
  );
  assert.equal(
    parseQuickCheck({
      topicId: 3,
      prompt: "Pregunta",
      response: "x".repeat(1001),
      needsReview: false,
    }),
    null,
  );
  assert.equal(
    parseQuickCheck({
      topicId: 3,
      prompt: "Pregunta",
      response: "Respuesta",
      needsReview: "false",
    }),
    null,
  );
});
