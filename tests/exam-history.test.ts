import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveExamAttemptDetail,
  deriveExamHistoryPage,
  encodeAttemptRef,
  parseAttemptRef,
  type ExamAttemptRecord,
  type ExamHistoryMetadata,
} from "../lib/study/exam-history";

const currentMetadata: ExamHistoryMetadata = {
  examId: 20,
  examTitle: "Examen del tema",
  isCurrentExam: true,
  topicId: 30,
  topicTitle: "Tema publicado",
  topicApproved: true,
  classId: 40,
  classTitle: "Clase publicada",
  curriculumCode: "C12",
  classPublished: true,
};

const attempt: ExamAttemptRecord = {
  id: 101,
  examId: 20,
  completedAt: "2026-08-20T18:00:00.000Z",
  score: 8,
  totalQuestions: 10,
};

test("codifica referencias técnicas y rechaza cursores manipulados", () => {
  const reference = encodeAttemptRef(101);
  assert.equal(typeof reference, "string");
  assert.equal(parseAttemptRef(reference), 101);
  assert.equal(parseAttemptRef("101"), null);
  assert.equal(parseAttemptRef("referencia-invalida"), null);
  assert.equal(encodeAttemptRef(0), null);
});

test("deriva vigencia, porcentaje y paginación sin perder intentos históricos", () => {
  const attempts = Array.from({ length: 13 }, (_, index) => ({
    ...attempt,
    id: 113 - index,
    examId: index === 1 ? 21 : 20,
    score: index === 0 ? 7 : 8,
  }));
  const page = deriveExamHistoryPage(
    attempts,
    [
      currentMetadata,
      {
        ...currentMetadata,
        examId: 21,
        examTitle: "Versión anterior",
        isCurrentExam: false,
      },
    ],
    12,
  );

  assert.equal(page.items.length, 12);
  assert.equal(page.items[0].percentage, 70);
  assert.equal(page.items[0].status, "current");
  assert.equal(page.items[0].topicHref, "/temas/30");
  assert.equal(page.items[1].status, "historical");
  assert.equal(page.items[1].topicHref, null);
  assert.equal(parseAttemptRef(page.nextCursor), 102);
});

test("el detalle incluye solo la opción elegida y falla ante vínculos cruzados", () => {
  const answers = [
    { questionId: 501, selectedOptionId: 601, isCorrect: false },
  ];
  const questions = [
    { id: 501, examId: 20, text: "¿Qué norma aplica?", position: 1 },
  ];
  const selectedOptions = [
    { id: 601, questionId: 501, text: "La opción que elegí" },
  ];
  const detail = deriveExamAttemptDetail(
    attempt,
    currentMetadata,
    answers,
    questions,
    selectedOptions,
  );

  assert.deepEqual(detail?.responses, [
    {
      questionId: 501,
      question: "¿Qué norma aplica?",
      selectedOption: "La opción que elegí",
      isCorrect: false,
    },
  ]);
  assert.equal(JSON.stringify(detail).includes("correctOption"), false);
  assert.equal(
    deriveExamAttemptDetail(attempt, currentMetadata, answers, questions, [
      { id: 601, questionId: 999, text: "Opción de otra pregunta" },
    ]),
    null,
  );
});
