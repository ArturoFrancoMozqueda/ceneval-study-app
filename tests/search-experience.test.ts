import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/buscar/page.tsx", "utf8");

test("la búsqueda cubre la biblioteca publicada sin ocultar fallas", () => {
  assert.match(source, /Buscar en todo el contenido/);
  for (const table of ["subjects", "classes", "topics"]) {
    assert.match(source, new RegExp(`\\.from\\("${table}"\\)`));
  }
  assert.match(source, /\.ilike\("name"/);
  assert.match(source, /\.ilike\("title"/);
  assert.match(source, /\.ilike\("description"/);
  assert.match(source, /classes\.publication_status", "published"/);
  assert.match(source, /topics\.approval_status", "approved"/);
  assert.match(source, /const failures =/);
  assert.match(source, /writeDependencyFailure/);
  assert.match(source, /No pudimos buscar en la biblioteca\. Intenta nuevamente\./);
  assert.match(source, /results\.length === 30/);
  assert.match(source, /type: "Materia"/);
  assert.match(source, /type: "Clase"/);
  assert.match(source, /type: "Tema"/);
  assert.match(source, /role="search"/);
  assert.match(source, /aria-live="polite"/);
});
