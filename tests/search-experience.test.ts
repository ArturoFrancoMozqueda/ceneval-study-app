import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/buscar/page.tsx", "utf8");

test("la búsqueda cubre títulos y descripciones sin ocultar fallas", () => {
  assert.match(source, /Buscar por tema o concepto/);
  assert.match(source, /\.ilike\("title"/);
  assert.match(source, /\.ilike\("description"/);
  assert.match(source, /if \(titleResult\.error \|\| descriptionResult\.error\)/);
  assert.match(source, /writeDependencyFailure/);
  assert.match(source, /No pudimos buscar los temas\. Intenta nuevamente\./);
  assert.match(source, /topics\.length === 30/);
  assert.match(source, /aria-live="polite"/);
});
