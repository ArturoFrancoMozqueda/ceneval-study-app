import assert from "node:assert/strict";
import test from "node:test";
import {
  derivePublicationDiagnostics,
  requiredMaterialTypes,
} from "../lib/publication-readiness";

const topic = { id: 7, title: "Tema aprobado" };
const completeMaterials = requiredMaterialTypes.map((material_type) => ({
  topic_id: topic.id,
  material_type,
}));

test("acepta un tema que cumple exactamente el contrato editorial", () => {
  const result = derivePublicationDiagnostics({
    topics: [topic],
    materials: completeMaterials,
    conceptMaps: [{ topic_id: topic.id }],
    flashcards: Array.from({ length: 10 }, () => ({ topic_id: topic.id })),
    exams: [
      {
        id: 3,
        topic_id: topic.id,
        exam_questions: Array.from({ length: 10 }, (_, index) => ({ id: index + 1 })),
      },
    ],
  });

  assert.deepEqual(result, []);
});

test("detalla cada requisito faltante sin mezclar datos de otros temas", () => {
  const result = derivePublicationDiagnostics({
    topics: [topic],
    materials: [
      ...completeMaterials.filter(({ material_type }) => material_type !== "legal_basis"),
      { topic_id: 99, material_type: "legal_basis" },
    ],
    conceptMaps: [{ topic_id: 99 }],
    flashcards: [
      ...Array.from({ length: 8 }, () => ({ topic_id: topic.id })),
      ...Array.from({ length: 4 }, () => ({ topic_id: 99 })),
    ],
    exams: [],
  });

  assert.deepEqual(result, [
    {
      topicId: 7,
      topicTitle: "Tema aprobado",
      missingMaterialTypes: ["legal_basis"],
      hasConceptMap: false,
      flashcardCount: 8,
      hasCurrentExam: false,
      examQuestionCount: 0,
    },
  ]);
});

test("rechaza un examen actual con una cantidad distinta de diez preguntas", () => {
  const result = derivePublicationDiagnostics({
    topics: [topic],
    materials: completeMaterials,
    conceptMaps: [{ topic_id: topic.id }],
    flashcards: Array.from({ length: 12 }, () => ({ topic_id: topic.id })),
    exams: [
      {
        id: 3,
        topic_id: topic.id,
        exam_questions: Array.from({ length: 11 }, (_, index) => ({ id: index + 1 })),
      },
    ],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.examQuestionCount, 11);
});

test("no inventa diagnósticos cuando no hay temas aprobados", () => {
  assert.deepEqual(
    derivePublicationDiagnostics({
      topics: [],
      materials: [],
      conceptMaps: [],
      flashcards: [],
      exams: [],
    }),
    [],
  );
});
