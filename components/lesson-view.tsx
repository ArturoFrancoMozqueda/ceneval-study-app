"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveStudyProgressAction } from "@/app/actions/academic";
import { ConceptMap } from "@/components/concept-map";
import { ContentShield } from "@/components/content-shield";
import { ProtectedText } from "@/components/protected-text";
import type {
  LessonBundle,
  StudyMaterial,
  StudyProgress,
} from "@/lib/data/academic";
import {
  getProgressSaveFeedback,
  type ProgressSaveState,
} from "@/lib/study/progress-presentation";

const steps = [
  { id: "discover", label: "Vista breve" },
  { id: "understand", label: "Explicación" },
  { id: "apply", label: "Casos" },
] as const;
type StepId = (typeof steps)[number]["id"];
const stepIds = steps.map(({ id }) => id);

const sourceLabels = {
  class: "Explicado en clase",
  complementary: "Explicación complementaria",
  mixed: "Clase + fuentes complementarias",
};

const materialFunctionLabels: Record<StudyMaterial["materialType"], string> = {
  short_answer: "Punto de partida",
  full_explanation: "Explicación principal",
  legal_basis: "Fundamento jurídico",
  simple_example: "Ejemplo sencillo",
  ceneval_example: "Caso tipo CENEVAL",
  common_errors: "Prevención de errores",
  summary: "Cierre",
  key_concepts: "Conceptos clave",
  study_guide: "Guía de estudio",
};

function Material({ material }: { material: StudyMaterial }) {
  return (
    <ContentShield>
      <article className="rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            {materialFunctionLabels[material.materialType]}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
            {sourceLabels[material.sourceOrigin]}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold">{material.title}</h2>
        <ProtectedText
          as="div"
          className="mt-3 whitespace-pre-line leading-8 text-foreground/80"
        >
          {material.content}
        </ProtectedText>
      </article>
    </ContentShield>
  );
}

function MaterialDisclosure({
  label,
  description,
  materials,
}: {
  label: string;
  description: string;
  materials: StudyMaterial[];
}) {
  if (materials.length === 0) return null;

  return (
    <ContentShield>
      <details className="group rounded-2xl border border-border bg-white open:border-brand/30">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 font-semibold text-brand marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-7">
          <span>{label}</span>
          <span aria-hidden="true" className="text-xl leading-none group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="border-t border-border px-5 pb-6 pt-4 sm:px-7">
          <p className="text-sm leading-6 text-muted">{description}</p>
          <div className="mt-5 space-y-6">
            {materials.map((material) => (
              <article key={material.id}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    {materialFunctionLabels[material.materialType]}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                    {sourceLabels[material.sourceOrigin]}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{material.title}</h2>
                <ProtectedText
                  as="div"
                  className="mt-3 whitespace-pre-line leading-8 text-foreground/80"
                >
                  {material.content}
                </ProtectedText>
              </article>
            ))}
          </div>
        </div>
      </details>
    </ContentShield>
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
    stepIds.includes(initialProgress?.currentStep as StepId)
      ? (initialProgress?.currentStep as StepId)
      : "discover",
  );
  const sessionMinutes = initialProgress?.sessionMinutes ?? 10;
  const [completed, setCompleted] = useState<StepId[]>(
    (initialProgress?.completedSteps ?? []).filter((step): step is StepId =>
      stepIds.includes(step as StepId),
    ),
  );
  const [openingRevealed, setOpeningRevealed] = useState(false);
  const [quickCheckIndex, setQuickCheckIndex] = useState(0);
  const [quickCheckRevealed, setQuickCheckRevealed] = useState(false);
  const [caseStage, setCaseStage] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [saveState, setSaveState] = useState<ProgressSaveState>("idle");
  const saveSequence = useRef(0);
  const sourcesBackRef = useRef<HTMLButtonElement>(null);
  const sourcesTriggerRef = useRef<HTMLButtonElement>(null);
  const sourcesWereOpenRef = useRef(false);
  const stepPanelRef = useRef<HTMLElement>(null);
  const focusStepOnChangeRef = useRef(false);
  const [, startSaving] = useTransition();

  const cases = lesson.materials.filter(({ materialType }) =>
    ["simple_example", "ceneval_example"].includes(materialType),
  );
  const opener =
    lesson.materials.find(({ materialType }) => materialType === "short_answer") ??
    lesson.materials[0];
  const closing = lesson.materials.find(
    ({ materialType }) => materialType === "summary",
  );
  const explanation = lesson.materials.find(
    ({ materialType }) => materialType === "full_explanation",
  );
  const legalBasis = lesson.materials.filter(
    ({ materialType }) => materialType === "legal_basis",
  );
  const commonErrors = lesson.materials.find(
    ({ materialType }) => materialType === "common_errors",
  );
  const optionalReviews = lesson.materials.filter(({ materialType }) =>
    ["key_concepts", "study_guide"].includes(materialType),
  );
  const journey = lesson.learningJourney;
  const quickCheck = journey?.quickChecks[quickCheckIndex];

  useEffect(() => {
    if (showSources) {
      sourcesWereOpenRef.current = true;
      sourcesBackRef.current?.focus();
    } else if (sourcesWereOpenRef.current) {
      sourcesWereOpenRef.current = false;
      sourcesTriggerRef.current?.focus();
    }
  }, [showSources]);

  useEffect(() => {
    if (!focusStepOnChangeRef.current) return;
    focusStepOnChangeRef.current = false;
    stepPanelRef.current?.focus();
  }, [activeStep]);

  function persist(
    nextStep: StepId,
    nextIndex: number,
    nextCompleted = completed,
  ) {
    const sequence = saveSequence.current + 1;
    saveSequence.current = sequence;
    setSaveState("saving");
    startSaving(async () => {
      try {
        const result = await saveStudyProgressAction({
          topicId: lesson.topic.id,
          currentStep: nextStep,
          materialIndex: nextIndex,
          sessionMinutes,
          completedSteps: nextCompleted,
        });
        if (saveSequence.current === sequence) {
          setSaveState(result.error ? "error" : "saved");
        }
      } catch {
        if (saveSequence.current === sequence) setSaveState("error");
      }
    });
  }

  function goToStep(nextStep: StepId) {
    focusStepOnChangeRef.current = true;
    setActiveStep(nextStep);
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
    focusStepOnChangeRef.current = nextStep !== step;
    setActiveStep(nextStep);
    persist(nextStep, 0, nextCompleted);
  }

  if (showSources) {
    return (
      <section className="mt-8">
        <button
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
          onClick={() => setShowSources(false)}
          ref={sourcesBackRef}
          type="button"
        >
          ← Volver a la sesión
        </button>
        <div className="mt-5 space-y-6">
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
                  <span className="sr-only"> (abre en una pestaña nueva)</span>
                  <span className="mt-1 block text-sm text-muted">
                    {reference.institution} · {reference.jurisdiction}
                    {reference.citation ? ` · ${reference.citation}` : ""}
                  </span>
                  <span className="mt-2 block text-xs text-muted">
                    Consultada: {reference.retrievedOn}
                    {reference.legalVerifiedOn
                      ? ` · Verificación jurídica: ${reference.legalVerifiedOn}`
                      : ""}
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
        <p className="text-sm font-semibold text-success">Lección de apoyo</p>
        <h2 className="mt-1 text-2xl font-semibold" id="session-title">
          Consulta solo lo que necesites
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          La práctica es la actividad principal. Aquí puedes volver a la vista breve,
          profundizar en la explicación o revisar los casos sin perder tu avance.
        </p>
      </section>

      <nav aria-label="Recorrido de aprendizaje" className="mt-7">
        <ol className="grid grid-cols-3 gap-2">
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
                <span className="font-mono text-xs">{index + 1}/{steps.length}</span>
                <span className="block text-sm font-semibold">{step.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p
          aria-live={saveState === "error" ? "assertive" : "polite"}
          className={`mt-2 text-right text-xs ${
            saveState === "error" ? "font-semibold text-danger" : "text-muted"
          }`}
          role={saveState === "error" ? "alert" : "status"}
        >
          {getProgressSaveFeedback(saveState)}
        </p>
      </nav>

      <section
        aria-label={`Paso ${stepIds.indexOf(activeStep) + 1}: ${steps.find(({ id }) => id === activeStep)?.label}`}
        className="mt-6 scroll-mt-24"
        ref={stepPanelRef}
        role="region"
        tabIndex={-1}
      >
        {activeStep === "discover" ? (
          <ContentShield>
            <div className="rounded-3xl bg-brand p-6 text-white sm:p-9">
              <p className="text-sm font-semibold text-white/70">
                Antes de leer
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold">
                {journey?.openingPrompt ?? lesson.topic.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                Intenta responder mentalmente o en papel. La orientación aparece solo
                cuando decidas contrastar tu idea.
              </p>
              {openingRevealed ? (
                <div className="mt-6 border-t border-white/20 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    Orientación esencial
                  </p>
                  <ProtectedText as="p" className="mt-3 max-w-3xl leading-8 text-white/90">
                    {opener?.content ?? lesson.topic.description}
                  </ProtectedText>
                  <button
                    className="mt-6 min-h-12 rounded-xl bg-white px-5 font-semibold text-brand"
                    onClick={() => completeAndContinue("discover")}
                    type="button"
                  >
                    Profundizar en la explicación
                  </button>
                </div>
              ) : (
                <button
                  className="mt-6 min-h-12 rounded-xl bg-white px-5 font-semibold text-brand"
                  onClick={() => setOpeningRevealed(true)}
                  type="button"
                >
                  Contrastar mi idea
                </button>
              )}
            </div>
          </ContentShield>
        ) : null}

        {activeStep === "understand" ? (
          <div className="space-y-6">
            {quickCheck ? (
              <ContentShield>
                <section className="rounded-2xl border border-brand/20 bg-brand-soft p-5 sm:p-6" aria-labelledby="quick-check-title">
                  <p className="text-sm font-semibold text-success">
                    Comprobación {quickCheckIndex + 1} de {journey?.quickChecks.length}
                  </p>
                  <h2 className="mt-2 text-xl" id="quick-check-title">{quickCheck.prompt}</h2>
                  {quickCheckRevealed ? (
                    <div className="mt-5 border-t border-brand/15 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-success">Respuesta</p>
                      <ProtectedText as="p" className="mt-2 font-semibold leading-7">{quickCheck.answer}</ProtectedText>
                      <ProtectedText as="p" className="mt-2 text-sm leading-6 text-muted">{quickCheck.feedback}</ProtectedText>
                      {journey && quickCheckIndex < journey.quickChecks.length - 1 ? (
                        <button
                          className="mt-4 min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
                          onClick={() => {
                            setQuickCheckIndex((current) => current + 1);
                            setQuickCheckRevealed(false);
                          }}
                          type="button"
                        >
                          Siguiente comprobación
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className="mt-5 min-h-11 rounded-xl border border-brand/20 bg-white px-5 text-sm font-semibold text-brand"
                      onClick={() => setQuickCheckRevealed(true)}
                      type="button"
                    >
                      Ver respuesta después de intentarlo
                    </button>
                  )}
                </section>
              </ContentShield>
            ) : null}
            {explanation ? <Material material={explanation} /> : null}

            <MaterialDisclosure
              description="Consulta la base normativa cuando necesites verificar de dónde proviene la explicación principal."
              label="Ver fundamento jurídico"
              materials={legalBasis}
            />

            {lesson.conceptMap ? (
              <ConceptMap
                description={lesson.conceptMap.description}
                nodes={lesson.conceptMap.nodes}
                title={lesson.conceptMap.title}
              />
            ) : null}

            {commonErrors ? (
              <section aria-label="Evita estos errores">
                <p className="mb-3 text-sm font-semibold text-danger">
                  Evita estos errores
                </p>
                <Material material={commonErrors} />
              </section>
            ) : null}

            <button
              className="min-h-12 rounded-xl bg-brand px-5 font-semibold text-white"
              onClick={() => completeAndContinue("understand")}
              type="button"
            >
              Aplicar lo aprendido
            </button>
          </div>
        ) : null}

        {activeStep === "apply" ? (
          <div className="space-y-5">
            {journey ? (
              <ContentShield>
                <section className="rounded-2xl border border-border bg-white p-6" aria-labelledby="guided-case-title">
                <p className="text-sm font-semibold text-success">
                  Decisión guiada
                </p>
                  <h2 className="mt-2 text-xl" id="guided-case-title">{journey.practicalCase.question}</h2>
                  <ProtectedText as="p" className="mt-3 text-sm leading-6 text-muted">{journey.practicalCase.facts}</ProtectedText>
                  <div className="mt-5 space-y-4 border-t border-border pt-5">
                    {caseStage >= 1 ? (
                      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-success">1 · Norma</p><ProtectedText as="p" className="mt-2 leading-7">{journey.practicalCase.legalRule}</ProtectedText></div>
                    ) : null}
                    {caseStage >= 2 ? (
                      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-success">2 · Razonamiento</p><ProtectedText as="p" className="mt-2 leading-7">{journey.practicalCase.reasoning}</ProtectedText></div>
                    ) : null}
                    {caseStage >= 3 ? (
                      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-success">3 · Conclusión</p><ProtectedText as="p" className="mt-2 font-semibold leading-7">{journey.practicalCase.conclusion}</ProtectedText></div>
                    ) : null}
                    {caseStage < 3 ? (
                      <button
                        className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
                        onClick={() => setCaseStage((current) => current + 1)}
                        type="button"
                      >
                        {caseStage === 0 ? "Revelar la norma" : caseStage === 1 ? "Contrastar el razonamiento" : "Ver la conclusión"}
                      </button>
                    ) : null}
                  </div>
                </section>
              </ContentShield>
            ) : (
              <ContentShield>
                <div className="rounded-2xl border border-border bg-white p-6">
                  <p className="text-sm font-semibold text-success">Decisión guiada</p>
                  <h2 className="mt-2 text-xl font-semibold">Hechos → norma → razonamiento → conclusión</h2>
                </div>
              </ContentShield>
            )}
            {cases.map((material) => (
              <Material key={material.id} material={material} />
            ))}
            {closing ? <Material material={closing} /> : null}
            <MaterialDisclosure
              description="Son reformulaciones opcionales del tema. Ábrelas solo si otra presentación te ayuda."
              label="Otras formas de repasar"
              materials={optionalReviews}
            />
            <div className="rounded-2xl border border-success/25 bg-success-soft p-5">
              <p className="text-sm leading-6 text-muted">
                {journey?.closingPrompt ?? "Cierra la lectura intentando recuperar el tema sin mirar."}
              </p>
              {journey?.nextActivity ? <p className="mt-2 text-sm font-semibold text-success">Siguiente actividad: {journey.nextActivity}</p> : null}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {!completed.includes("apply") ? (
                  <button
                    className="min-h-12 rounded-xl border border-success/30 bg-white px-5 font-semibold text-success"
                    onClick={() => completeAndContinue("apply")}
                    type="button"
                  >
                    Marcar lección como consultada
                  </button>
                ) : null}
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white"
                  href={`/temas/${lesson.topic.id}`}
                >
                  Practicar este tema
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <button
        className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
        onClick={() => setShowSources(true)}
        ref={sourcesTriggerRef}
        type="button"
      >
        Consultar fuentes jurídicas
      </button>
    </div>
  );
}
