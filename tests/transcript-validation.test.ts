import assert from "node:assert/strict";
import test from "node:test";
import {
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
  assert.match(error ?? "", /El archivo no se modificó/);
  assert.equal(originalText.length, MAX_TRANSCRIPT_LENGTH + 137);
});

test("mantiene la validación mínima después de normalizar espacios", () => {
  assert.equal(
    getTranscriptValidationError("   texto breve   "),
    "La fuente editorial local debe contener al menos 30 caracteres.",
  );
});
