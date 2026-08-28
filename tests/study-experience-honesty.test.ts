import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getProgressSaveFeedback,
  getTopicJourneyStatus,
} from "../lib/study/progress-presentation";

const lessonSource = readFileSync("components/lesson-view.tsx", "utf8");
const dashboardSource = readFileSync("components/home-dashboard.tsx", "utf8");
const studySource = readFileSync("app/estudiar/page.tsx", "utf8");
const reviewSource = readFileSync("app/estudiar/repaso/page.tsx", "utf8");
const flashcardsSource = readFileSync("components/flashcards-deck.tsx", "utf8");
const adaptivePracticeSource = readFileSync("components/adaptive-practice.tsx", "utf8");
const topicDetailSource = readFileSync("components/topic-detail.tsx", "utf8");
const progressSource = readFileSync(
  "components/subject-progress-overview.tsx",
  "utf8",
);
const academicSource = readFileSync("lib/data/academic.ts", "utf8");

test("los pasos recorridos describen avance, no dominio académico", () => {
  assert.equal(getTopicJourneyStatus(0), "Por comenzar");
  assert.equal(getTopicJourneyStatus(1), "En curso");
  assert.equal(getTopicJourneyStatus(3), "Recorrido completado");
  assert.equal(getTopicJourneyStatus(5), "Recorrido completado");
  assert.doesNotMatch(
    [dashboardSource, studySource, lessonSource, flashcardsSource, progressSource].join("\n"),
    /dominad[ao]s?/i,
  );
  assert.match(flashcardsSource, /recordadas en esta ronda/);
});

test("el estado de guardado solo anuncia éxito después de confirmarlo", () => {
  assert.equal(getProgressSaveFeedback("idle"), "Tus cambios se guardan al avanzar.");
  assert.equal(getProgressSaveFeedback("saving"), "Guardando avance…");
  assert.equal(getProgressSaveFeedback("saved"), "Avance guardado");
  assert.match(getProgressSaveFeedback("error"), /No se guardó/);
  assert.match(lessonSource, /const result = await saveStudyProgressAction/);
  assert.match(lessonSource, /result\.error \? "error" : "saved"/);
  assert.match(lessonSource, /role=\{saveState === "error" \? "alert" : "status"\}/);
});

test("la práctica exige intentar antes de revelar y separa el simulacro", () => {
  assert.doesNotMatch(lessonSource, /\(\[5, 10, 15\] as const\)/);
  assert.doesNotMatch(studySource, /5, 10 o 15/);
  assert.doesNotMatch(lessonSource, /lesson\.flashcards\[0\]/);
  assert.doesNotMatch(lessonSource, /saveQuickCheckAction|Ver explicación/);
  assert.match(adaptivePracticeSource, /Antes de ver la clave/);
  assert.match(adaptivePracticeSource, /disabled=\{!confidence \|\| saving\}/);
  assert.match(topicDetailSource, /modo=\$\{value\}/);
  assert.match(topicDetailSource, /verás la revisión[\s\S]*solo después de entregar/);
  assert.match(reviewSource, /<AdaptivePractice[\s\S]*adaptive/);
  assert.match(adaptivePracticeSource, /abandonPracticeSessionAction/);
  assert.match(adaptivePracticeSource, /ronda anterior de otro tema/);
});

test("el progreso visible no ofrece una autoevaluación que ya no existe", () => {
  assert.doesNotMatch(
    `${progressSource}\n${dashboardSource}`,
    /Comprobación rápida|Sin comprobaciones|autoevaluaciones/i,
  );
  assert.doesNotMatch(progressSource, /QuickCheckEvidence/);
  assert.match(progressSource, /sm:grid-cols-2/);
});

test("los nueve materiales se presentan por función sin fingir contenido nuevo", () => {
  for (const materialType of [
    "short_answer",
    "full_explanation",
    "legal_basis",
    "simple_example",
    "ceneval_example",
    "common_errors",
    "summary",
    "key_concepts",
    "study_guide",
  ]) {
    assert.match(lessonSource, new RegExp(`${materialType}:`));
  }

  assert.match(lessonSource, /label="Ver fundamento jurídico"/);
  assert.match(lessonSource, /label="Otras formas de repasar"/);
  assert.match(lessonSource, /reformulaciones opcionales del tema/);
  assert.match(lessonSource, /<details className=/);
  assert.doesNotMatch(lessonSource, /Bloque \{safeMaterialIndex/);
});

test("la lección usa el recorrido editorial con revelado progresivo", () => {
  assert.match(academicSource, /\.from\("topic_learning_journeys"\)/);
  assert.match(academicSource, /learningJourney: journeyResult\.data\?\.content/);
  assert.match(lessonSource, /journey\?\.openingPrompt/);
  assert.match(lessonSource, /quickCheck\.prompt/);
  assert.match(lessonSource, /Ver respuesta después de intentarlo/);
  const rule = lessonSource.indexOf("journey.practicalCase.legalRule");
  const reasoning = lessonSource.indexOf("journey.practicalCase.reasoning");
  const conclusion = lessonSource.indexOf("journey.practicalCase.conclusion");
  assert.ok(rule >= 0 && rule < reasoning && reasoning < conclusion);
});
