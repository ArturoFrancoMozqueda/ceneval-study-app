import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardSource = readFileSync(
  new URL("../components/home-dashboard.tsx", import.meta.url),
  "utf8",
);

test("autentica antes de consultar datos del inicio", () => {
  const authPosition = dashboardSource.indexOf("await requireUser()"),
    subjectsPosition = dashboardSource.indexOf("getSubjects()");

  assert.notEqual(authPosition, -1, "Falta la comprobacion de sesion.");
  assert.notEqual(subjectsPosition, -1, "Falta la consulta de materias.");
  assert.ok(
    authPosition < subjectsPosition,
    "La sesion debe comprobarse antes de consultar materias.",
  );
  assert.doesNotMatch(
    dashboardSource,
    /Promise\.all\(\[requireUser\(\),\s*getSubjects\(\)\]\)/,
  );
});

test("el inicio no convierte fallas de progreso en estados académicos vacíos", () => {
  assert.match(dashboardSource, /if \(attempts\.error\)/);
  assert.match(dashboardSource, /if \(progressResult\.error\)/);
  assert.match(dashboardSource, /if \(nextTopicResult\.error\)/);
  assert.match(dashboardSource, /writeDependencyFailure/);
  assert.match(
    dashboardSource,
    /throw new Error\("No pudimos consultar tu avance\. Intenta nuevamente\."\)/,
  );
});
