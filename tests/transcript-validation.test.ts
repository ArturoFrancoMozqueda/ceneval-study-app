import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextTabIndex,
  getTranscriptValidationError,
  MAX_TRANSCRIPT_LENGTH,
} from "../lib/transcript-validation";

test("acepta transcripciones mayores a 50 mil dentro del contrato de la base", () => {
  assert.equal(getTranscriptValidationError("a".repeat(50_001)), null);
  assert.equal(
    getTranscriptValidationError("a".repeat(MAX_TRANSCRIPT_LENGTH)),
    null,
  );
});

test("rechaza sin truncar el texto que excede 200 mil caracteres", () => {
  const originalText = "a".repeat(MAX_TRANSCRIPT_LENGTH + 137);
  const error = getTranscriptValidationError(originalText);

  assert.match(error ?? "", /200,137 caracteres/);
  assert.match(error ?? "", /Reduce al menos 137/);
  assert.match(error ?? "", /El texto no se modificó/);
  assert.equal(originalText.length, MAX_TRANSCRIPT_LENGTH + 137);
});

test("mantiene la validación mínima después de normalizar espacios", () => {
  assert.equal(
    getTranscriptValidationError("   texto breve   "),
    "Pega una transcripción de al menos 30 caracteres.",
  );
});

test("calcula el foco roving de pestañas y su recorrido circular", () => {
  assert.equal(getNextTabIndex(0, "ArrowRight", 2), 1);
  assert.equal(getNextTabIndex(1, "ArrowRight", 2), 0);
  assert.equal(getNextTabIndex(0, "ArrowLeft", 2), 1);
  assert.equal(getNextTabIndex(1, "Home", 2), 0);
  assert.equal(getNextTabIndex(0, "End", 2), 1);
  assert.equal(getNextTabIndex(0, "Tab", 2), null);
});
