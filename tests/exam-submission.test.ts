import assert from "node:assert/strict";
import test from "node:test";
import {
  gradeExamSelections,
  parseExamSubmission,
  parsePersistedExamResult,
  validateExamSelections,
} from "../lib/exam-submission";

const questions = [{ id: 11 }, { id: 12 }];
const options = [
  { id: 101, questionId: 11 },
  { id: 102, questionId: 11 },
  { id: 201, questionId: 12 },
  { id: 202, questionId: 12 },
];

test("acepta únicamente IDs enteros positivos y respuestas numéricas", () => {
  assert.deepEqual(parseExamSubmission(7, { "11": 101 }), {
    examId: 7,
    answers: { "11": 101 },
  });
  assert.equal(parseExamSubmission("7", { "11": 101 }), null);
  assert.equal(parseExamSubmission(7, { "11": "101" }), null);
  assert.equal(parseExamSubmission(7.5, { "11": 101 }), null);
  assert.equal(parseExamSubmission(7, { "011": 101 }), null);
});

test("valida la respuesta mínima y segura de la RPC transaccional", () => {
  assert.deepEqual(parsePersistedExamResult({ status: "incomplete" }), {
    status: "incomplete",
  });
  assert.deepEqual(
    parsePersistedExamResult({
      status: "success",
      id: 81,
      score: 1,
      total: 1,
      review: [
        {
          questionId: 11,
          correct: true,
          explanation: "Explicación general",
          selectedOptionExplanation: "Explicación elegida",
        },
      ],
    }),
    {
      status: "success",
      id: 81,
      score: 1,
      total: 1,
      review: [
        {
          questionId: 11,
          correct: true,
          explanation: "Explicación general",
          selectedOptionExplanation: "Explicación elegida",
        },
      ],
    },
  );
  assert.equal(
    parsePersistedExamResult({
      status: "success",
      id: 81,
      score: 2,
      total: 1,
      review: [],
    }),
    null,
  );
  assert.equal(
    parsePersistedExamResult({
      status: "success",
      id: 81,
      score: 0,
      total: 1,
      review: [
        {
          questionId: 11,
          correct: false,
          explanation: "Explicación general",
          selectedOptionExplanation: "",
        },
      ],
    }),
    null,
  );
});

test("rechaza opciones que pertenecen a otra pregunta", () => {
  const result = validateExamSelections(
    { "11": 201, "12": 202 },
    questions,
    options,
  );

  assert.deepEqual(result, { success: false, reason: "invalid" });
});

test("distingue respuestas incompletas y rechaza preguntas ajenas", () => {
  assert.deepEqual(validateExamSelections({ "11": 101 }, questions, options), {
    success: false,
    reason: "incomplete",
  });
  assert.deepEqual(
    validateExamSelections(
      { "11": 101, "12": 201, "99": 202 },
      questions,
      options,
    ),
    { success: false, reason: "invalid" },
  );
});

test("la retroalimentación incluye solo la explicación de la opción elegida", () => {
  const selections = [
    { questionId: 11, selectedOptionId: 102 },
    { questionId: 12, selectedOptionId: 201 },
  ];
  const result = gradeExamSelections(selections, options, [
    {
      questionId: 11,
      correctOptionId: 101,
      explanation: "Explicación general 11",
      optionExplanations: {
        "101": "Explicación que no debe viajar",
        "102": "Explicación elegida 102",
      },
    },
    {
      questionId: 12,
      correctOptionId: 201,
      explanation: "Explicación general 12",
      optionExplanations: {
        "201": "Explicación elegida 201",
        "202": "Otra explicación que no debe viajar",
      },
    },
  ]);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.score, 1);
  assert.deepEqual(result.review, [
    {
      questionId: 11,
      correct: false,
      explanation: "Explicación general 11",
      selectedOptionExplanation: "Explicación elegida 102",
    },
    {
      questionId: 12,
      correct: true,
      explanation: "Explicación general 12",
      selectedOptionExplanation: "Explicación elegida 201",
    },
  ]);
  assert.equal(JSON.stringify(result).includes("no debe viajar"), false);
});

test("rechaza una clave correcta asociada a una opción de otra pregunta", () => {
  const result = gradeExamSelections(
    [{ questionId: 11, selectedOptionId: 101 }],
    options,
    [
      {
        questionId: 11,
        correctOptionId: 201,
        explanation: "Explicación general",
        optionExplanations: { "101": "Explicación elegida" },
      },
    ],
  );

  assert.deepEqual(result, { success: false, reason: "invalid" });
});

test("la calificación también rechaza una selección cruzada", () => {
  const result = gradeExamSelections(
    [{ questionId: 11, selectedOptionId: 201 }],
    options,
    [
      {
        questionId: 11,
        correctOptionId: 101,
        explanation: "Explicación general",
        optionExplanations: { "201": "Explicación ajena" },
      },
    ],
  );

  assert.deepEqual(result, { success: false, reason: "invalid" });
});
