"use client";

import { useState, useTransition } from "react";
import {
  saveQuickCheckAction,
  saveStudyProgressAction,
} from "@/app/actions/academic";
import { ConceptMap } from "@/components/concept-map";
import { ExamPlayer } from "@/components/exam-player";
import { FlashcardsDeck } from "@/components/flashcards-deck";
import type {
  LessonBundle,
  StudyMaterial,
  StudyProgress,
} from "@/lib/data/academic";

const steps = [
  { id: "discover", label: "Descubre" },
  { id: "understand", label: "Comprende" },
  { id: "apply", label: "Aplica" },
  { id: "remember", label: "Recuerda" },
  { id: "check", label: "Comprueba" },
] as const;
type StepId = (typeof steps)[number]["id"];
const stepIds = steps.map(({ id }) => id);

function Material({ material }: { material: StudyMaterial }) {
  const sourceLabels = {
    class: "Explicado en clase",
    complementary: "Explicación complementaria",
    mixed: "Clase + fuentes complementarias",
  };
  return (
    <article className="rounded-2xl border border-border bg-white p-5 sm:p-7">
      <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
        {sourceLabels[material.sourceOrigin]}
      </span>
      <h2 className="mt-4 text-xl font-semibold">{material.title}</h2>
      <div className="mt-3 whitespace-pre-line leading-8 text-foreground/80">
        {material.content}
      </div>
    </article>
  );
}

export function LessonView({
  lesson,
  initialProgress,
}: {
  lesson: LessonBundle;
  initialProgress: StudyProgress | null;
}) {
  const [activeStep, setActiveStep] = useState<StepId>(
    initialProgress?.currentStep ?? "discover",
  );
  const [materialIndex, setMaterialIndex] = useState(
    initialProgress?.materialIndex ?? 0,
  );
  const [sessionMinutes, setSessionMinutes] = useState<5 | 10 | 15>(
    initialProgress?.sessionMinutes ?? 10,
  );
  const [completed, setCompleted] = useState<StepId[]>(
    initialProgress?.completedSteps ?? [],
  );
  const [showSources, setShowSources] = useState(false);
  const [quickCheckRevealed, setQuickCheckRevealed] = useState(false);
  const [quickCheckSaved, setQuickCheckSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const conceptual = lesson.materials.filter(
    ({ materialType }) =>
      ![
        "short_answer",
        "simple_example",
        "ceneval_example",
        "summary",
        "study_guide",
      ].includes(materialType),
  );
  const cases = lesson.materials.filter(({ materialType }) =>
    ["simple_example", "ceneval_example"].includes(materialType),
  );
  const opener =
    lesson.materials.find(({ materialType }) => materialType === "short_answer") ??
    lesson.materials[0];
  const closing = lesson.materials.find(
    ({ materialType }) => materialType === "summary",
  );
  const quickCard = lesson.flashcards[0];
  const safeMaterialIndex = Math.min(
    materialIndex,
    Math.max(conceptual.length - 1, 0),
  );

  function persist(
    nextStep: StepId,
    nextIndex: number,
    nextCompleted = completed,
    minutes = sessionMinutes,
  ) {
    startSaving(async () => {
      await saveStudyProgressAction({
        topicId: lesson.topic.id,
        currentStep: nextStep,
        materialIndex: nextIndex,
        sessionMinutes: minutes,
        completedSteps: nextCompleted,
      });
    });
  }

  function goToStep(nextStep: StepId) {
    setActiveStep(nextStep);
    setMaterialIndex(0);
    setShowSources(false);
    persist(nextStep, 0);
  }

  function completeAndContinue(step: StepId) {
    const nextCompleted = completed.includes(step)
      ? completed
      : [...completed, step];
    const nextStep =
      stepIds[Math.min(stepIds.indexOf(step) + 1, stepIds.length - 1)];
    setCompleted(nextCompleted);
    setActiveStep(nextStep);
    setMaterialIndex(0);
    persist(nextStep, 0, nextCompleted);
  }

  async function saveQuickCheck(needsReview: boolean) {
    if (!quickCard) return;
    const result = await saveQuickCheckAction({
      topicId: lesson.topic.id,
      prompt: quickCard.question,
      response: needsReview ? "Necesito repasarlo" : "Lo comprendí",
      needsReview,
    });
    if (!result.error) setQuickCheckSaved(true);
  }

  if (showSources) {
    return (
      <section className="mt-8">
        <button
          className="text-sm font-semibold text-brand"
          onClick={() => setShowSources(false)}
          type="button"
        >
          ← Volver a la sesión
        </button>
        <div className="mt-5 space-y-6">
          <article className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-xl font-semibold">Transcripción original</h2>
            <p className="mt-2 text-sm text-muted">
              Se conserva sin modificaciones para consultar lo dicho en clase.
            </p>
            <div className="mt-5 max-h-[32rem] overflow-y-auto whitespace-pre-line rounded-xl bg-background p-5 text-sm leading-7">
              {lesson.transcript?.originalText ??
                "No hay una transcripción disponible."}
            </div>
          </article>
          <article>
            <h2 className="text-xl font-semibold">Referencias jurídicas</h2>
            <div className="mt-4 space-y-3">
              {lesson.references.map((reference) => (
                <a
                  className="block rounded-xl border border-border bg-white p-4 hover:border-brand/30"
                  href={reference.url}
                  key={reference.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="font-semibold text-brand">
                    {reference.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {reference.institution} · {reference.jurisdiction}
                    {reference.citation ? ` · ${reference.citation}` : ""}
                  </span>
                </a>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-8">
      <section
        aria-labelledby="session-title"
        className="rounded-3xl border border-border bg-surface p-5 sm:p-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-success">Tu sesión</p>
            <h2 className="mt-1 text-2xl font-semibold" id="session-title">
              Elige cómo avanzar hoy
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tu posición se guarda automáticamente. No hay rachas ni puntos.
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Tiempo disponible</legend>
            <div className="mt-2 flex gap-2">
              {([5, 10, 15] as const).map((minutes) => (
                <button
                  aria-pressed={sessionMinutes === minutes}
                  className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${
                    sessionMinutes === minutes
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white"
                  }`}
                  key={minutes}
                  onClick={() => {
                    setSessionMinutes(minutes);
                    persist(activeStep, materialIndex, completed, minutes);
                  }}
                  type="button"
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["discover", "Entender un tema", "Parte de una pregunta y construye la explicación."],
            ["apply", "Practicar casos", "Aplica la norma a situaciones concretas."],
            ["remember", "Repasar errores", "Vuelve a lo difícil con tarjetas y retroalimentación."],
          ].map(([step, title, text]) => (
            <button
              className="rounded-2xl border border-border bg-white p-4 text-left hover:border-brand/40"
              key={step}
              onClick={() => goToStep(step as StepId)}
              type="button"
            >
              <span className="font-semibold">{title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                {text}
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav aria-label="Recorrido de aprendizaje" className="mt-7">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                aria-current={activeStep === step.id ? "step" : undefined}
                className={`min-h-16 w-full rounded-xl border p-3 text-left ${
                  activeStep === step.id
                    ? "border-brand bg-brand text-white"
                    : completed.includes(step.id)
                      ? "border-success/30 bg-success-soft"
                      : "border-border bg-white"
                }`}
                onClick={() => goToStep(step.id)}
                type="button"
              >
                <span className="font-mono text-xs">{index + 1}/5</span>
                <span className="block text-sm font-semibold">{step.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p aria-live="polite" className="mt-2 text-right text-xs text-muted">
          {isSaving ? "Guardando avance…" : "Avance guardado automáticamente"}
        </p>
      </nav>

      <section className="mt-6">
        {activeStep === "discover" ? (
          <div className="rounded-3xl bg-brand p-6 text-white sm:p-9">
            <p className="text-sm font-semibold text-white/70">Antes de leer</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold">
              ¿Cómo resolverías este tema si apareciera hoy en un caso CENEVAL?
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-white/85">
              {opener?.content ?? lesson.topic.description}
            </p>
            <button
              className="mt-6 min-h-12 rounded-xl bg-white px-5 font-semibold text-brand"
              onClick={() => completeAndContinue("discover")}
              type="button"
            >
              Construir mi respuesta
            </button>
          </div>
        ) : null}

        {activeStep === "understand" ? (
          <div className="space-y-6">
            {lesson.conceptMap ? (
              <ConceptMap
                description={lesson.conceptMap.description}
                nodes={lesson.conceptMap.nodes}
                title={lesson.conceptMap.title}
              />
            ) : null}

            <article className="rounded-3xl border border-border bg-white p-5 sm:p-7">
              <p className="text-sm font-semibold text-success">
                Guía de preguntas y respuestas
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Comprueba las ideas esenciales
              </h2>
              <p className="mt-2 leading-7 text-muted">
                Abre cada pregunta para consultar la respuesta explicada.
              </p>
              <div className="mt-5 space-y-3">
                {lesson.flashcards.map((card, index) => (
                  <details
                    className="rounded-xl border border-border bg-background p-4 open:bg-white"
                    key={card.id}
                  >
                    <summary className="cursor-pointer font-semibold">
                      <span className="mr-2 font-mono text-xs text-muted">
                        {index + 1}.
                      </span>
                      {card.question}
                    </summary>
                    <p className="mt-3 border-t border-border pt-3 leading-7 text-foreground/80">
                      {card.answer}
                    </p>
                  </details>
                ))}
              </div>
            </article>

            <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-xs text-muted">
                Bloque {safeMaterialIndex + 1} de {conceptual.length || 1}
              </p>
              <div
                aria-label={`${safeMaterialIndex + 1} de ${conceptual.length || 1}`}
                aria-valuemax={conceptual.length || 1}
                aria-valuemin={1}
                aria-valuenow={safeMaterialIndex + 1}
                className="h-2 w-32 overflow-hidden rounded-full bg-border"
                role="progressbar"
              >
                <div
                  className="h-full bg-success"
                  style={{
                    width: `${((safeMaterialIndex + 1) / (conceptual.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            {conceptual[safeMaterialIndex] ? (
              <Material material={conceptual[safeMaterialIndex]} />
            ) : (
              <p className="text-muted">La explicación está pendiente.</p>
            )}
            <div className="mt-4 flex justify-between gap-3">
              <button
                className="min-h-11 rounded-xl border border-border bg-white px-4 font-semibold disabled:opacity-40"
                disabled={safeMaterialIndex === 0}
                onClick={() => {
                  const next = safeMaterialIndex - 1;
                  setMaterialIndex(next);
                  persist("understand", next);
                }}
                type="button"
              >
                Anterior
              </button>
              <button
                className="min-h-11 rounded-xl bg-brand px-5 font-semibold text-white"
                onClick={() => {
                  if (safeMaterialIndex >= conceptual.length - 1) {
                    completeAndContinue("understand");
                  } else {
                    const next = safeMaterialIndex + 1;
                    setMaterialIndex(next);
                    persist("understand", next);
                  }
                }}
                type="button"
              >
                {safeMaterialIndex >= conceptual.length - 1
                  ? "Aplicar lo aprendido"
                  : "Siguiente bloque"}
              </button>
            </div>
            </div>
          </div>
        ) : null}

        {activeStep === "apply" ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm font-semibold text-success">
                Decisión guiada
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Hechos → norma → razonamiento → conclusión
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Identifica primero la regla aplicable y después contrasta tu
                razonamiento con la explicación.
              </p>
            </div>
            {cases.map((material) => (
              <Material key={material.id} material={material} />
            ))}
            {quickCard ? (
              <article className="rounded-2xl border border-brand/20 bg-white p-6">
                <p className="text-sm font-semibold text-success">
                  Comprobación rápida · no afecta tu calificación
                </p>
                <h3 className="mt-3 text-lg font-semibold">
                  {quickCard.question}
                </h3>
                {quickCheckRevealed ? (
                  <>
                    <p className="mt-4 rounded-xl bg-background p-4 leading-7">
                      {quickCard.answer}
                    </p>
                    {!quickCheckSaved ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="min-h-11 rounded-xl border border-border px-4 font-semibold"
                          onClick={() => saveQuickCheck(true)}
                          type="button"
                        >
                          Necesito repasarlo
                        </button>
                        <button
                          className="min-h-11 rounded-xl bg-success px-4 font-semibold text-white"
                          onClick={() => saveQuickCheck(false)}
                          type="button"
                        >
                          Lo comprendí
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm font-semibold text-success">
                        Respuesta guardada para orientar tu próximo repaso.
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    className="mt-4 min-h-11 rounded-xl bg-brand px-4 font-semibold text-white"
                    onClick={() => setQuickCheckRevealed(true)}
                    type="button"
                  >
                    Ver explicación
                  </button>
                )}
              </article>
            ) : null}
            <button
              className="min-h-12 rounded-xl bg-brand px-5 font-semibold text-white"
              onClick={() => completeAndContinue("apply")}
              type="button"
            >
              Pasar al repaso
            </button>
          </div>
        ) : null}

        {activeStep === "remember" ? (
          <FlashcardsDeck
            cards={lesson.flashcards}
            onComplete={() => completeAndContinue("remember")}
          />
        ) : null}

        {activeStep === "check" ? (
          <div>
            {closing ? (
              <div className="mb-5">
                <Material material={closing} />
              </div>
            ) : null}
            {lesson.exam ? (
              <ExamPlayer
                exam={lesson.exam}
                onComplete={() => {
                  const nextCompleted: StepId[] = completed.includes("check")
                    ? completed
                    : [...completed, "check"];
                  setCompleted(nextCompleted);
                  persist("check", 0, nextCompleted);
                }}
              />
            ) : (
              <p className="text-muted">El examen está pendiente.</p>
            )}
          </div>
        ) : null}
      </section>

      <button
        className="mt-8 text-sm font-semibold text-brand"
        onClick={() => setShowSources(true)}
        type="button"
      >
        Consultar transcripción y fuentes jurídicas
      </button>
    </div>
  );
}
