import assert from "node:assert/strict";
import test from "node:test";
import { deriveNextStudyAction } from "../lib/study/next-action";
import type { StudyPlanOverview } from "../lib/study/study-plan";

const plan: StudyPlanOverview = {
  source: "new", recommendedCount: 0, difficultCount: 0, nextReviewAt: null,
};
const topic = { id: 42, title: "Tema de prueba" };
const session = { id: 7, curriculumCode: "C02", title: "Clase", completedSteps: 0, totalSteps: 3 };

test("una lección pausada vuelve al modo lección, incluso antes de completar un paso", () => {
  for (const completedSteps of [0, 1, 2]) {
    const action = deriveNextStudyAction({ plan, topic, completedSteps, session });
    assert.equal(action.href, "/temas/42?modo=leccion");
    assert.equal(action.label, "Continuar lección");
  }
});

test("la ronda activa tiene prioridad sobre otra lección y el orden curricular", () => {
  const action = deriveNextStudyAction({
    plan: { ...plan, source: "active", recommendedCount: 3 }, topic, completedSteps: 1, session,
  });
  assert.equal(action.href, "/estudiar/repaso");
  assert.equal(action.label, "Continuar práctica");
  assert.match(action.description, /3 preguntas/);
});

test("después de la lección recomienda el repaso debido antes de contenido nuevo", () => {
  const action = deriveNextStudyAction({
    plan: { ...plan, source: "adaptive", recommendedCount: 5 }, topic, completedSteps: 3, session,
  });
  assert.equal(action.href, "/estudiar/repaso");
  assert.equal(action.label, "Repasar ahora");
});

test("un tema retirado no impide continuar por la ruta publicada", () => {
  assert.equal(deriveNextStudyAction({ plan, topic: null, completedSteps: 1, session }).href, "/clases/7");
});

test("una lección terminada sin examen conserva la recomendación de acreditar", () => {
  const action = deriveNextStudyAction({ plan, topic, completedSteps: 3, session: { ...session, completedSteps: 3 } });
  assert.equal(action.href, "/clases/7");
  assert.match(action.description, /examen/);
});

test("no confunde ausencia de sesiones con acreditación", () => {
  const action = deriveNextStudyAction({ plan, topic: null, completedSteps: 0 });
  assert.equal(action.href, "/estudiar");
  assert.doesNotMatch(action.description, /acreditada/);
});
