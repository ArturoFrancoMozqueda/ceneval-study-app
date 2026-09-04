"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { reviewFlashcardAction } from "@/app/actions/academic";
import {
  abandonPracticeSessionAction,
  getPracticeSessionAction,
  rateAdaptiveAttemptAction,
  revealAdaptiveItemAction,
  startOrResumePracticeSessionAction,
} from "@/app/actions/adaptive-practice";
import { ContentShield } from "@/components/content-shield";
import { ProtectedText } from "@/components/protected-text";
import type { Flashcard } from "@/lib/data/academic";
import {
  createPracticeQueue,
  feedbackForPracticeResult,
  insertSingleRetry,
  type PracticeConfidence,
  type PracticeAnswerKey,
  type PracticeSession,
  type PracticeOutcome,
  ratingForPracticeResult,
} from "@/lib/study/adaptive-practice";

type PracticeCard = Flashcard & {
  contextLabel?: string;
  contextHref?: string;
};

const confidenceOptions: Array<{
  value: PracticeConfidence;
  label: string;
  help: string;
}> = [
  { value: "sure", label: "Puedo explicarlo", help: "Tengo una respuesta clara." },
  { value: "unsure", label: "Tengo dudas", help: "Recuerdo algo, pero no todo." },
  { value: "no_recall", label: "No lo recuerdo", help: "Necesito ver la clave." },
];

const outcomeOptions: Array<{
  value: PracticeOutcome;
  label: string;
  help: string;
}> = [
  { value: "incorrect", label: "Incorrecta", help: "No recuperé la idea central." },
  { value: "partial", label: "Parcial", help: "Acerté una parte, pero faltó algo." },
  { value: "correct", label: "Correcta", help: "Mi respuesta contiene la idea completa." },
];

export function AdaptivePractice({
  cards,
  completionHref,
  completionLabel = "Hacer el simulacro",
  topicId,
  adaptive = false,
}: {
  cards: PracticeCard[];
  completionHref?: string;
  completionLabel?: string;
  topicId?: number;
  adaptive?: boolean;
}) {
  const shouldLoadAdaptive = adaptive || topicId !== undefined;
  const [queue, setQueue] = useState(() => createPracticeQueue(cards.length));
  const [cursor, setCursor] = useState(0);
  const [adaptiveSession, setAdaptiveSession] = useState<
    PracticeSession | null | undefined
  >(shouldLoadAdaptive ? undefined : null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answerKey, setAnswerKey] = useState<PracticeAnswerKey | null>(null);
  const [confidence, setConfidence] = useState<PracticeConfidence | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratchpad, setScratchpad] = useState("");
  const [retriedCards, setRetriedCards] = useState<number[]>([]);
  const [counts, setCounts] = useState({ correct: 0, partial: 0, incorrect: 0 });
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [starting, setStarting] = useState(false);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  const accessibleId = useId();
  const usingAdaptiveCorpus = Boolean(adaptiveSession);
  const sessionFromAnotherTopic = Boolean(
    topicId && adaptiveSession?.items.some((item) => item.topicId !== topicId),
  );
  const displayCards: PracticeCard[] = adaptiveSession
    ? adaptiveSession.items.map((item, index) => ({
        id: item.id,
        question: item.prompt,
        answer: "",
        position: index + 1,
        contextLabel: `${item.stableCode} · ${
          item.retrievalType === "free_recall"
            ? "Recuerdo libre"
            : item.retrievalType === "cued_recall"
              ? "Recuerdo guiado"
              : "Reconocimiento"
        }`,
      }))
    : cards;
  const finished = cursor >= queue.length;
  const cardIndex = queue[cursor];
  const card = cardIndex === undefined ? undefined : displayCards[cardIndex];

  useEffect(() => {
    if (!shouldLoadAdaptive) return;
    let active = true;
    getPracticeSessionAction()
      .then((result) => {
        if (!active) return;
        if ("error" in result) {
          setAdaptiveSession(null);
          setQueue(createPracticeQueue(cards.length));
          setCursor(0);
          return;
        }
        setAdaptiveSession(result.session);
        if (result.session) {
          setQueue(result.session.items.map((_, index) => index));
          setCursor(Math.max(0, result.session.currentPosition - 1));
        }
      })
      .catch(() => {
        if (!active) return;
        setAdaptiveSession(null);
        setQueue(createPracticeQueue(cards.length));
        setCursor(0);
      });
    return () => {
      active = false;
    };
  }, [cards.length, shouldLoadAdaptive, topicId]);

  useEffect(() => {
    if (finished) completionRef.current?.focus();
    else if (cursor > 0) questionRef.current?.focus();
  }, [cursor, finished]);

  if (shouldLoadAdaptive && adaptiveSession === undefined) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-6 text-muted" role="status">
        Preparando una ronda breve con tus preguntas disponibles…
      </p>
    );
  }

  async function startAdaptiveRound() {
    setStarting(true);
    setSaveError("");
    try {
      const result = await startOrResumePracticeSessionAction({
        ...(topicId === undefined ? {} : { topicId }),
        targetSize: 5,
      });
      if ("error" in result) {
        setSaveError(result.error);
        return;
      }
      setAdaptiveSession(result.session);
      setQueue(result.session.items.map((_, index) => index));
      setCursor(Math.max(0, result.session.currentPosition - 1));
    } catch {
      setSaveError("No pudimos preparar la ronda. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setStarting(false);
    }
  }

  async function startFreshAdaptiveRound() {
    if (!adaptiveSession) return;
    setSaving(true);
    setSaveError("");
    const abandoned = await abandonPracticeSessionAction({
      sessionId: adaptiveSession.id,
    });
    if ("error" in abandoned) {
      setSaveError(abandoned.error);
      setSaving(false);
      return;
    }
    setAdaptiveSession(undefined);
    const result = await startOrResumePracticeSessionAction({
      ...(topicId === undefined ? {} : { topicId }),
      targetSize: 5,
    });
    if ("error" in result) {
      setAdaptiveSession(null);
      setQueue(createPracticeQueue(cards.length));
      setCursor(0);
    } else {
      setAdaptiveSession(result.session);
      setQueue(result.session.items.map((_, index) => index));
      setCursor(Math.max(0, result.session.currentPosition - 1));
    }
    setConfidence(null);
    setRevealed(false);
    setScratchpad("");
    setAttemptId(null);
    setAnswerKey(null);
    setCounts({ correct: 0, partial: 0, incorrect: 0 });
    setFeedback("");
    setSaving(false);
  }

  if (shouldLoadAdaptive && !adaptiveSession) {
    return (
      <section className="rounded-3xl border border-brand/15 bg-surface p-6 sm:p-8">
        <p className="text-sm font-semibold text-success">Ronda lista para preparar</p>
        <h2 className="mt-2 text-2xl font-semibold">Empieza cuando estés lista</h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Abrir esta pantalla no cambia tu avance. Al iniciar, prepararemos hasta
          cinco preguntas según tus repasos pendientes; si aún no tienes historial,
          comenzaremos con contenido nuevo.
        </p>
        {saveError ? (
          <p className="mt-4 text-sm font-semibold text-danger" role="alert">
            {saveError}
          </p>
        ) : null}
        <button
          className="mt-6 min-h-12 rounded-xl bg-brand px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={starting}
          onClick={startAdaptiveRound}
          type="button"
        >
          {starting ? "Preparando ronda…" : "Iniciar ronda adaptativa"}
        </button>
      </section>
    );
  }

  if (!displayCards.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-muted">
        Este tema todavía no tiene preguntas disponibles para practicar.
      </p>
    );
  }

  if (finished) {
    return (
      <section className="rounded-3xl border border-success/25 bg-success-soft p-6 sm:p-8">
        <p className="text-sm font-semibold text-success">Sesión terminada</p>
        <h2 className="mt-2 text-3xl" ref={completionRef} tabIndex={-1}>
          Ya hiciste el trabajo difícil: recuperar
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          {counts.correct} correctas · {counts.partial} parciales · {counts.incorrect}{" "}
          incorrectas. Los errores no borran el avance: indican qué conviene volver a intentar.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="min-h-12 rounded-xl border border-border bg-white px-5 font-semibold text-brand"
            onClick={async () => {
              if (shouldLoadAdaptive && usingAdaptiveCorpus) {
                setAdaptiveSession(undefined);
                const result = await startOrResumePracticeSessionAction({
                  ...(topicId === undefined ? {} : { topicId }),
                  targetSize: 5,
                });
                if ("error" in result) {
                  setAdaptiveSession(null);
                  setQueue(createPracticeQueue(cards.length));
                  setCursor(0);
                } else {
                  setAdaptiveSession(result.session);
                  setQueue(result.session.items.map((_, index) => index));
                  setCursor(Math.max(0, result.session.currentPosition - 1));
                }
              } else {
                setQueue(createPracticeQueue(cards.length));
                setCursor(0);
              }
              setConfidence(null);
              setRevealed(false);
              setScratchpad("");
              setRetriedCards([]);
              setCounts({ correct: 0, partial: 0, incorrect: 0 });
              setFeedback("");
              setAttemptId(null);
              setAnswerKey(null);
            }}
            type="button"
          >
            Practicar otra ronda
          </button>
          {completionHref ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white"
              href={completionHref}
            >
              {completionLabel}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (!card) return null;

  async function reveal() {
    const activeCard = card;
    if (!confidence || !activeCard) return;
    setSaving(true);
    setSaveError("");
    try {
      if (usingAdaptiveCorpus) {
        const result = await revealAdaptiveItemAction({
          itemId: activeCard.id,
          confidence,
        });
        if ("error" in result) {
          setSaveError(result.error);
          return;
        }
        setAttemptId(result.attemptId);
        setAnswerKey(result.key);
      }
      setRevealed(true);
    } catch {
      setSaveError("No pudimos abrir la clave. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function rate(outcome: PracticeOutcome) {
    const activeCard = card;
    if (!confidence || !activeCard) return;
    setSaving(true);
    setSaveError("");
    try {
      if (usingAdaptiveCorpus) {
        if (!attemptId) return;
        const result = await rateAdaptiveAttemptAction({ attemptId, outcome });
        if ("error" in result) {
          setSaveError(result.error);
          return;
        }
        setCounts((current) => ({ ...current, [outcome]: current[outcome] + 1 }));
        setFeedback(feedbackForPracticeResult(outcome));
        const refreshed = await getPracticeSessionAction();
        if (!("error" in refreshed) && refreshed.session) {
          setAdaptiveSession(refreshed.session);
          setQueue(refreshed.session.items.map((_, index) => index));
          setCursor(Math.max(0, refreshed.session.currentPosition - 1));
        } else {
          setCursor(queue.length);
        }
        setConfidence(null);
        setRevealed(false);
        setScratchpad("");
        setAttemptId(null);
        setAnswerKey(null);
        return;
      }

      const result = await reviewFlashcardAction(
        activeCard.id,
        ratingForPracticeResult(confidence, outcome),
      );
      if (result.error) {
        setSaveError(result.error);
        return;
      }

      setCounts((current) => ({ ...current, [outcome]: current[outcome] + 1 }));
      setFeedback(feedbackForPracticeResult(outcome));

      if (
        (outcome === "incorrect" || outcome === "partial") &&
        !retriedCards.includes(activeCard.id)
      ) {
        setQueue((current) => insertSingleRetry(current, cursor, cardIndex));
        setRetriedCards((current) => [...current, activeCard.id]);
      }

      setCursor((current) => current + 1);
      setConfidence(null);
      setRevealed(false);
      setScratchpad("");
      setAttemptId(null);
      setAnswerKey(null);
    } catch {
      setSaveError("No se guardó este intento. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  const stage = revealed ? 3 : confidence ? 2 : 1;

  return (
    <section aria-labelledby={`${accessibleId}-question`}>
      {sessionFromAnotherTopic ? (
        <aside className="mb-4 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm leading-6">
          Tienes una ronda anterior de otro tema. Puedes terminarla para conservar
          el contexto o abandonarla y preparar una ronda de este tema.
        </aside>
      ) : null}
      <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-white text-xs font-semibold sm:text-sm">
        {["Intentar", "Contrastar", "Ajustar"].map((label, index) => (
          <span
            aria-current={stage === index + 1 ? "step" : undefined}
            className={`px-3 py-3 text-center ${
              stage === index + 1
                ? "bg-brand text-white"
                : stage > index + 1
                  ? "bg-success-soft text-success"
                  : "text-muted"
            }`}
            key={label}
          >
            {label}
          </span>
        ))}
      </div>

      {feedback ? (
        <p className="mb-4 rounded-xl border border-success/20 bg-success-soft p-4 text-sm leading-6" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-mono text-xs text-muted">
          Pregunta {cursor + 1} de {queue.length}
        </p>
        {card.contextLabel ? (
          <p className="font-semibold text-success">{card.contextLabel}</p>
        ) : null}
        {usingAdaptiveCorpus ? (
          <button
            className="min-h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-brand hover:border-brand/30 disabled:opacity-50"
            disabled={saving}
            onClick={startFreshAdaptiveRound}
            type="button"
          >
            Abandonar y preparar otra ronda
          </button>
        ) : null}
      </div>

      <ContentShield>
        <article className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
            Recupera antes de mirar
          </p>
          <h2
            className="mt-4 max-w-3xl text-2xl leading-9"
            id={`${accessibleId}-question`}
            ref={questionRef}
            tabIndex={-1}
          >
            <ProtectedText as="span">{card.question}</ProtectedText>
          </h2>

          {!revealed ? (
            <div className="mt-7">
              <label className="block text-sm font-semibold" htmlFor={`${accessibleId}-scratchpad`}>
                Esboza tu respuesta <span className="font-normal text-muted">(opcional)</span>
              </label>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-border bg-background p-4 leading-7"
                id={`${accessibleId}-scratchpad`}
                onChange={(event) => setScratchpad(event.target.value)}
                placeholder="Este borrador permanece en tu dispositivo y se borra al avanzar."
                value={scratchpad}
              />
              <fieldset className="mt-6">
                <legend className="font-semibold">Antes de ver la clave, ¿qué tan segura estás?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {confidenceOptions.map((option) => (
                    <label
                      className={`cursor-pointer rounded-2xl border p-4 ${
                        confidence === option.value
                          ? "border-brand bg-brand-soft"
                          : "border-border bg-surface hover:border-brand/30"
                      }`}
                      key={option.value}
                    >
                      <input
                        checked={confidence === option.value}
                        className="sr-only"
                        name={`${accessibleId}-confidence`}
                        onChange={() => setConfidence(option.value)}
                        type="radio"
                        value={option.value}
                      />
                      <span className="block font-semibold">{option.label}</span>
                      <span className="mt-1 block text-sm leading-5 text-muted">{option.help}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                className="mt-6 min-h-12 w-full rounded-xl bg-brand px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                disabled={!confidence || saving}
                onClick={reveal}
                type="button"
              >
                {saving ? "Abriendo clave…" : "Comparar con la clave"}
              </button>
            </div>
          ) : (
            <div className="mt-7 border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
                Clave de comparación
              </p>
              {answerKey ? (
                <div className="mt-4 space-y-5">
                  <div>
                    <h3 className="font-semibold">Puntos que debe contener</h3>
                    <ul className="mt-2 space-y-2 text-sm leading-6">
                      {answerKey.requiredPoints.map((point) => (
                        <li className="flex gap-2" key={point}>
                          <span aria-hidden="true" className="text-success">✓</span>
                          <ProtectedText as="span">{point}</ProtectedText>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {answerKey.acceptableAlternatives.length ? (
                    <details className="rounded-xl border border-border bg-background p-4">
                      <summary className="cursor-pointer font-semibold text-brand">
                        Ver formulaciones aceptables
                      </summary>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                        {answerKey.acceptableAlternatives.map((alternative) => (
                          <li key={alternative}><ProtectedText as="span">{alternative}</ProtectedText></li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  {answerKey.commonErrors.length ? (
                    <div className="rounded-xl bg-danger-soft p-4">
                      <h3 className="text-sm font-semibold text-danger">Error que conviene evitar</h3>
                      <ProtectedText as="p" className="mt-2 text-sm leading-6 text-muted">
                        {answerKey.commonErrors[0]}
                      </ProtectedText>
                    </div>
                  ) : null}
                  <details className="rounded-xl border border-border p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-brand">
                      Consultar evidencia jurídica
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                      {answerKey.evidence.map((evidence) => (
                        <li key={evidence.code}>
                          {evidence.href ? (
                            <a className="font-semibold text-brand underline-offset-4 hover:underline" href={evidence.href} rel="noreferrer" target="_blank">
                              {evidence.label}
                              <span className="sr-only"> (abre en una pestaña nueva)</span>
                            </a>
                          ) : evidence.label}
                          {evidence.verifiedOn ? ` · Verificada ${evidence.verifiedOn}` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              ) : (
                <ProtectedText as="p" className="mt-3 text-lg font-semibold leading-8">
                  {card.answer}
                </ProtectedText>
              )}
              <fieldset className="mt-7">
                <legend className="font-semibold">Compara con honestidad: ¿cómo resultó tu respuesta?</legend>
                <div aria-busy={saving} className="mt-3 grid gap-3 sm:grid-cols-3">
                  {outcomeOptions.map((option) => (
                    <button
                      className="min-h-24 rounded-2xl border border-border bg-surface p-4 text-left hover:border-brand/35 disabled:cursor-wait disabled:opacity-60"
                      disabled={saving}
                      key={option.value}
                      onClick={() => rate(option.value)}
                      type="button"
                    >
                      <span className="block font-semibold">{option.label}</span>
                      <span className="mt-1 block text-sm leading-5 text-muted">{option.help}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </article>
      </ContentShield>

      {saveError ? (
        <p className="mt-4 text-sm font-semibold text-danger" role="alert">
          {saveError}
        </p>
      ) : null}
      {card.contextHref ? (
        <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand" href={card.contextHref}>
          Consultar la lección de apoyo
        </Link>
      ) : null}
    </section>
  );
}
