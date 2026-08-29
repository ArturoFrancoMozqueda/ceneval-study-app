import assert from "node:assert/strict";
import test from "node:test";
import { deriveSessionPath } from "../lib/study/session-path";

test("marca como actual la primera sesión cuyo examen no está completado", () => {
  const path = deriveSessionPath([
    { id: 1, examCompleted: true },
    { id: 2, examCompleted: false },
    { id: 3, examCompleted: false },
  ]);

  assert.deepEqual(
    path.map(({ pathStatus }) => pathStatus),
    ["completed", "current", "upcoming"],
  );
});

test("conserva como completada una sesión acreditada fuera de orden", () => {
  const path = deriveSessionPath([
    { id: 1, examCompleted: false },
    { id: 2, examCompleted: true },
  ]);

  assert.deepEqual(
    path.map(({ pathStatus }) => pathStatus),
    ["current", "completed"],
  );
});

test("no inventa un nivel actual cuando todos los exámenes están completados", () => {
  const path = deriveSessionPath([
    { id: 1, examCompleted: true },
    { id: 2, examCompleted: true },
  ]);

  assert.deepEqual(
    path.map(({ pathStatus }) => pathStatus),
    ["completed", "completed"],
  );
});

