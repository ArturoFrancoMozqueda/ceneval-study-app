import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveStudyOnboarding,
  type OnboardingSessionCandidate,
} from "../lib/study/onboarding";

const sessions: OnboardingSessionCandidate[] = [
  {
    id: 92,
    subjectId: 8,
    subjectName: "Derecho mercantil",
    title: "Títulos de crédito",
    curriculumCode: "C08",
    curriculumOrder: 8,
  },
  {
    id: 31,
    subjectId: 2,
    subjectName: "Derecho constitucional",
    title: "Control constitucional",
    curriculumCode: "C03",
    curriculumOrder: 3,
  },
  {
    id: 30,
    subjectId: 2,
    subjectName: "Derecho constitucional",
    title: "Derechos humanos",
    curriculumCode: "C02",
    curriculumOrder: 2,
  },
];

test("no interrumpe a quien ya tiene actividad de estudio", () => {
  assert.deepEqual(
    deriveStudyOnboarding({ hasActivity: true, sessions }),
    { kind: "returning" },
  );
});

test("recomienda la primera sesión curricular y una opción por materia", () => {
  assert.deepEqual(
    deriveStudyOnboarding({ hasActivity: false, sessions }),
    {
      kind: "ready",
      recommended: sessions[2],
      subjectChoices: [sessions[2], sessions[0]],
    },
  );
});

test("ignora sesiones incompletas antes de construir la ruta", () => {
  const invalid = {
    ...sessions[0],
    id: 0,
    curriculumCode: "sin-codigo",
    curriculumOrder: null,
  };

  assert.deepEqual(
    deriveStudyOnboarding({ hasActivity: false, sessions: [invalid] }),
    { kind: "unavailable" },
  );
});

test("muestra espera honesta cuando todavía no hay contenido publicado", () => {
  assert.deepEqual(
    deriveStudyOnboarding({ hasActivity: false, sessions: [] }),
    { kind: "unavailable" },
  );
});
