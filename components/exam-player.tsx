"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitExamAction, type ActionResult } from "@/app/actions/academic";
import type { Exam } from "@/lib/data/academic";
import {
  canSubmitExamRun,
  createExamRunState,
  restartExamRun,
  type ExamRunResult,
} from "@/lib/exam-player-state";

const difficultyLabel = {
  basic: "Básica",
  intermediate: "Intermedia",
  advanced: "Avanzada",
};

export function ExamPlayer({
  exam,
  onComplete,
}: {
  exam: Exam;
  onComplete?: () => void;
}) {
  const [run, setRun] = useState(createExamRunState);
  const submissionLock = useRef(false);
  const examStartRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (run.runNumber > 0) examStartRef.current?.focus();
  }, [run.runNumber]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      submissionLock.current ||
      !canSubmitExamRun(run, exam.questions.length)
    ) {
      return;
    }

    submissionLock.current = true;
    const submittedAnswers = run.answers;
    setRun((current) => ({ ...current, error: "", phase: "submitting" }));

    try {
      const response: ActionResult = await submitExamAction(
        exam.id,
        submittedAnswers,
      );
      if (response.error) {
        setRun((current) => ({
          ...current,
          error: response.error ?? "No pudimos entregar el examen.",
          phase: "answering",
        }));
        return;
      }
      if (
        response.score === undefined ||
        response.total === undefined ||
        !response.review
      ) {
        setRun((current) => ({
          ...current,
          error: "No pudimos mostrar el resultado. Intenta entregarlo nuevamente.",
          phase: "answering",
        }));
        return;
      }

      const result: ExamRunResult = {
        score: response.score,
        total: response.total,
        review: response.review,
      };
      setRun((current) => ({
        ...current,
        answers: submittedAnswers,
        phase: "reviewing",
        result,
      }));
      onComplete?.();
    } catch {
      setRun((current) => ({
        ...current,
        error:
          "No pudimos entregar el examen. Revisa tu conexión e intenta nuevamente.",
        phase: "answering",
      }));
    } finally {
      submissionLock.current = false;
    }
  }

  function restart() {
    submissionLock.current = false;
    setRun((current) => restartExamRun(current));
  }

  const { answers, error, phase, questionIndex, result } = run;

  if (result) {
    return (
      <section aria-labelledby="exam-result-title" aria-live="polite">
        <div className="rounded-2xl bg-success-soft p-6 text-center">
          <h2
            className="text-sm font-semibold text-success"
            id="exam-result-title"
          >
            Resultado
          </h2>
          <p className="mt-2 text-4xl font-semibold">
            {result.score}/{result.total}
          </p>
          <p className="mt-2 text-muted">
            Tu intento quedó guardado. Revisa cada razonamiento.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {exam.questions.map((question) => {
            const review = result.review?.find(
              ({ questionId }) => questionId === question.id,
            );
            const selectedOption = question.options.find(
              ({ id }) => id === answers[String(question.id)],
            );
            return (
              <article
                className="rounded-2xl border border-border bg-white p-5"
                key={question.id}
              >
                <p
                  className={`text-sm font-semibold ${
                    review?.correct ? "text-success" : "text-danger"
                  }`}
                >
                  {review?.correct ? "Respuesta correcta" : "Necesita repaso"}
                </p>
                <h3 className="mt-2 font-semibold">{question.text}</h3>
                <div className="mt-4 rounded-xl bg-background p-4">
                  <h4 className="text-sm font-semibold">Tu respuesta</h4>
                  <p className="mt-1 text-sm leading-6">
                    {selectedOption?.text}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {review?.selectedOptionExplanation}
                  </p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold">
                    Explicación general
                  </h4>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
                    {review?.explanation}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-background p-5">
          <h3 className="font-semibold">¿Quieres intentarlo otra vez?</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Tus respuestas y este resultado se conservarán como un intento
            anterior. Empezarás con todas las opciones vacías y, cuando vuelvas
            a entregar, se guardará un nuevo intento.
          </p>
          <button
            className="mt-4 min-h-12 rounded-xl bg-brand px-6 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={restart}
            type="button"
          >
            Repetir examen
          </button>
        </div>
      </section>
    );
  }

  const currentQuestion = exam.questions[questionIndex];

  return (
    <form aria-busy={phase === "submitting"} onSubmit={submit}>
      <p
        className="sr-only"
        ref={examStartRef}
        tabIndex={-1}
      >
        {run.runNumber > 0
          ? "Nuevo intento iniciado. Las respuestas están vacías."
          : "Examen iniciado."}
      </p>
      {run.runNumber > 0 ? (
        <p className="mb-4 rounded-xl bg-brand-soft p-4 text-sm leading-6">
          Nuevo intento: responde todas las preguntas. Al entregarlo, se
          guardará separado del intento anterior.
        </p>
      ) : null}
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted">
          Pregunta {questionIndex + 1} de {exam.questions.length}
        </p>
        <div
          aria-label={`${questionIndex + 1} de ${exam.questions.length} preguntas`}
          aria-valuemax={exam.questions.length}
          aria-valuemin={1}
          aria-valuenow={questionIndex + 1}
          className="h-2 w-36 overflow-hidden rounded-full bg-border"
          role="progressbar"
        >
          <div
            className="h-full bg-success"
            style={{
              width: `${((questionIndex + 1) / exam.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <fieldset
        className="rounded-2xl border border-border bg-white p-5 sm:p-6"
        disabled={phase === "submitting"}
      >
        <legend className="px-2 text-sm font-semibold text-success">
          {difficultyLabel[currentQuestion.difficulty]}
        </legend>
        <p className="mt-2 font-semibold leading-7">{currentQuestion.text}</p>
        <div className="mt-4 space-y-2">
          {currentQuestion.options.map((option) => (
            <label
              className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 hover:bg-background"
              key={option.id}
            >
              <input
                checked={answers[String(currentQuestion.id)] === option.id}
                className="mt-1"
                name={`question-${currentQuestion.id}`}
                onChange={() =>
                  setRun((current) => ({
                    ...current,
                    answers: {
                      ...current.answers,
                      [String(currentQuestion.id)]: option.id,
                    },
                  }))
                }
                required
                type="radio"
                value={option.id}
              />
              <span className="text-sm leading-6">{option.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="mt-5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-between gap-3">
        <button
          className="min-h-12 rounded-xl border border-border bg-white px-5 font-semibold disabled:opacity-40"
          disabled={phase === "submitting" || questionIndex === 0}
          onClick={() =>
            setRun((current) => ({
              ...current,
              questionIndex: current.questionIndex - 1,
            }))
          }
          type="button"
        >
          Anterior
        </button>
        {questionIndex < exam.questions.length - 1 ? (
          <button
            className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-40"
            disabled={!answers[String(currentQuestion.id)]}
            onClick={() =>
              setRun((current) => ({
                ...current,
                questionIndex: current.questionIndex + 1,
              }))
            }
            type="button"
          >
            Siguiente pregunta
          </button>
        ) : (
          <button
            className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-60"
            disabled={
              phase === "submitting" ||
              Object.keys(answers).length !== exam.questions.length
            }
            type="submit"
          >
            {phase === "submitting" ? "Calificando…" : "Entregar examen"}
          </button>
        )}
      </div>
    </form>
  );
}
