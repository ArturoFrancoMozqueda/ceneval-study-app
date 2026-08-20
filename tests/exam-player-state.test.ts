import assert from "node:assert/strict";
import test from "node:test";
import {
  canSubmitExamRun,
  createExamRunState,
  restartExamRun,
  type ExamRunState,
} from "../lib/exam-player-state";

test("reiniciar un examen elimina respuestas y retroalimentación anteriores", () => {
  const previousRun: ExamRunState = {
    answers: { "11": 101, "12": 202 },
    error: "Error anterior",
    phase: "reviewing",
    questionIndex: 1,
    result: {
      score: 1,
      total: 2,
      review: [
        {
          questionId: 11,
          correct: true,
          explanation: "Explicación anterior",
          selectedOptionExplanation: "Opción anterior",
        },
      ],
    },
    runNumber: 0,
  };

  const restarted = restartExamRun(previousRun);

  assert.deepEqual(restarted, createExamRunState(1));
  assert.notEqual(restarted.answers, previousRun.answers);
  assert.equal(JSON.stringify(restarted).includes("anterior"), false);
});

test("solo permite entregar una corrida completa que no esté enviándose", () => {
  const ready: ExamRunState = {
    ...createExamRunState(),
    answers: { "11": 101, "12": 202 },
  };

  assert.equal(canSubmitExamRun(ready, 2), true);
  assert.equal(canSubmitExamRun({ ...ready, phase: "submitting" }, 2), false);
  assert.equal(canSubmitExamRun({ ...ready, phase: "reviewing" }, 2), false);
  assert.equal(
    canSubmitExamRun({ ...ready, answers: { "11": 101 } }, 2),
    false,
  );
});
