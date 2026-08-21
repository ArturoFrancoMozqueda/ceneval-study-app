import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionPublicationStatus,
  derivePublicationDiagnostics,
  hasCurrentApprovedReview,
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

test("impide publicar un borrador y permite el recorrido revisión a publicación", () => {
  assert.equal(canTransitionPublicationStatus("draft", "published"), false);
  assert.equal(canTransitionPublicationStatus("draft", "review"), true);
  assert.equal(canTransitionPublicationStatus("review", "published"), true);
});

test("solo acepta una revisión aprobada que coincide con la versión exacta", () => {
  const currentReview = {
    verdict: "approved",
    contentVersion: 4,
    contentDigest: "abc123",
    legalVerifiedOn: "2026-08-20",
    invalidatedAt: null,
  };

  assert.equal(
    hasCurrentApprovedReview({
      classVersion: 4,
      classDigest: "abc123",
      review: currentReview,
    }),
    true,
  );
  assert.equal(
    hasCurrentApprovedReview({
      classVersion: 5,
      classDigest: "def456",
      review: currentReview,
    }),
    false,
  );
  assert.equal(
    hasCurrentApprovedReview({
      classVersion: 4,
      classDigest: "abc123",
      review: { ...currentReview, invalidatedAt: "2026-08-21T00:00:00Z" },
    }),
    false,
  );
});
