import assert from "node:assert/strict";
import test from "node:test";
import {
  parseReviewOverview,
  parseReviewOverviewRow,
} from "../lib/data/review-overview";

function card(id = 1) {
  return {
    id,
    question: `Pregunta ${id}`,
    answer: `Respuesta ${id}`,
    position: id,
    topicId: 10,
    topicTitle: "Tema publicado",
    classId: 20,
    classTitle: "Clase publicada",
    curriculumCode: "C01",
    rating: "hard" as const,
    nextReviewAt: "2026-08-21T18:00:00+00:00",
  };
}

function overview() {
  return {
    dueCards: [card()],
    currentDifficultCards: 1,
    currentDifficultChecks: 2,
    currentDifficultCount: 3,
    nextReviewAt: "2026-08-22T18:00:00Z",
  };
}

test("acepta el DTO exacto y conserva todas las tarjetas sin truncarlo", () => {
  const input = {
    ...overview(),
    dueCards: Array.from({ length: 685 }, (_, index) => card(index + 1)),
  };

  const parsed = parseReviewOverview(input);

  assert.equal(parsed.dueCards.length, 685);
  assert.deepEqual(parsed.dueCards[684], card(685));
});

test("rechaza campos adicionales en la raiz y las tarjetas", () => {
  assert.throws(() => parseReviewOverview(null));
  assert.throws(() => parseReviewOverview([]));
  assert.throws(() => parseReviewOverview({ ...overview(), dueCards: {} }));
  assert.throws(() => parseReviewOverview({ ...overview(), userId: "privado" }));
  assert.throws(() =>
    parseReviewOverview({
      ...overview(),
      dueCards: [{ ...card(), reviewedAt: "2026-08-21T17:00:00Z" }],
    }),
  );
});

test("valida estrictamente la fila wrapper de PostgREST", () => {
  assert.deepEqual(parseReviewOverviewRow({ overview: overview() }), overview());
  assert.throws(() => parseReviewOverviewRow(null));
  assert.throws(() => parseReviewOverviewRow({}));
  assert.throws(() =>
    parseReviewOverviewRow({ overview: overview(), unexpected: true }),
  );
});

test("rechaza ratings, identificadores, posiciones y fechas invalidos", () => {
  assert.throws(() =>
    parseReviewOverview({
      ...overview(),
      dueCards: [{ ...card(), rating: "dificil" }],
    }),
  );
  assert.throws(() =>
    parseReviewOverview({ ...overview(), dueCards: [{ ...card(), id: 0 }] }),
  );
  assert.throws(() =>
    parseReviewOverview({
      ...overview(),
      dueCards: [{ ...card(), position: 1.5 }],
    }),
  );
  assert.throws(() =>
    parseReviewOverview({ ...overview(), nextReviewAt: "mañana" }),
  );
});

test("rechaza conteos negativos, fraccionarios o internamente incoherentes", () => {
  assert.throws(() =>
    parseReviewOverview({ ...overview(), currentDifficultCards: -1 }),
  );
  assert.throws(() =>
    parseReviewOverview({ ...overview(), currentDifficultChecks: 1.5 }),
  );
  assert.throws(() =>
    parseReviewOverview({ ...overview(), currentDifficultCount: 4 }),
  );
});

test("acepta fechas nulas donde el contrato las permite", () => {
  const parsed = parseReviewOverview({
    ...overview(),
    dueCards: [{ ...card(), nextReviewAt: null }],
    nextReviewAt: null,
  });

  assert.equal(parsed.dueCards[0]?.nextReviewAt, null);
  assert.equal(parsed.nextReviewAt, null);
});
