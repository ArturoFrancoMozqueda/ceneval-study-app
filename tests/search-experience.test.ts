import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/buscar/page.tsx", "utf8");

test("la búsqueda describe su alcance y no oculta fallas de datos", () => {
  assert.match(source, /Buscar temas por título/);
  assert.match(source, /if \(topicsResult\.error\)/);
  assert.match(source, /writeDependencyFailure/);
  assert.match(source, /No pudimos buscar los temas\. Intenta nuevamente\./);
  assert.match(source, /topics\.length === 30/);
  assert.match(source, /aria-live="polite"/);
});
