import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const flashcards = readFileSync("components/flashcards-deck.tsx", "utf8");
const exam = readFileSync("components/exam-player.tsx", "utf8");
const lesson = readFileSync("components/lesson-view.tsx", "utf8");
const classPage = readFileSync("app/clases/[classId]/page.tsx", "utf8");
const subjectPage = readFileSync("app/materias/[subjectId]/page.tsx", "utf8");

test("las tarjetas nombran su contenido y restauran foco al avanzar", () => {
  assert.match(flashcards, /aria-labelledby=.*action.*content/);
  assert.match(flashcards, /Revelar respuesta para:/);
  assert.doesNotMatch(flashcards, /aria-label=\{revealed/);
  assert.match(flashcards, /aria-live="polite"/);
  assert.match(flashcards, /cardButtonRef\.current\?\.focus\(\)/);
  assert.match(flashcards, /completionTitleRef\.current\?\.focus\(\)/);
});

test("el examen usa la pregunta como leyenda y enfoca cambios y resultado", () => {
  assert.match(exam, /<legend[\s\S]*currentQuestion\.text[\s\S]*<\/legend>/);
  assert.match(exam, /questionRef\.current\?\.focus\(\)/);
  assert.match(exam, /resultTitleRef\.current\?\.focus\(\)/);
});

test("clases y materias inválidas terminan en la página 404", () => {
  for (const source of [classPage, subjectPage]) {
    assert.match(source, /Number\.isInteger/);
    assert.match(source, /< 1\) notFound\(\)/);
  }
});

test("los controles de texto independientes del tema miden al menos 24 px", () => {
  for (const label of ["← Volver a la sesión", "Consultar fuentes jurídicas"]) {
    const labelIndex = lesson.indexOf(label);
    assert.ok(labelIndex >= 0, `No se encontró ${label}`);
    const buttonStart = lesson.lastIndexOf("<button", labelIndex);
    const buttonSource = lesson.slice(buttonStart, labelIndex);
    assert.match(buttonSource, /inline-flex min-h-6 items-center/);
  }
});
