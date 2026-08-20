"use client";

import { useState, type FormEvent } from "react";
import { submitExamAction, type ActionResult } from "@/app/actions/academic";
import type { Exam } from "@/lib/data/academic";

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
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await submitExamAction(exam.id, answers);
    setSubmitting(false);
    if (response.error) {
      setError(response.error);
      return;
    }
    setResult(response);
    onComplete?.();
  }

  if (result?.score !== undefined) {
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
      </section>
    );
  }

  const currentQuestion = exam.questions[questionIndex];

  return (
    <form onSubmit={submit}>
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

      <fieldset className="rounded-2xl border border-border bg-white p-5 sm:p-6">
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
                  setAnswers((current) => ({
                    ...current,
                    [String(currentQuestion.id)]: option.id,
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
          disabled={questionIndex === 0}
          onClick={() => setQuestionIndex((current) => current - 1)}
          type="button"
        >
          Anterior
        </button>
        {questionIndex < exam.questions.length - 1 ? (
          <button
            className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-40"
            disabled={!answers[String(currentQuestion.id)]}
            onClick={() => setQuestionIndex((current) => current + 1)}
            type="button"
          >
            Siguiente pregunta
          </button>
        ) : (
          <button
            className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-60"
            disabled={
              submitting ||
              Object.keys(answers).length !== exam.questions.length
            }
            type="submit"
          >
            {submitting ? "Calificando…" : "Entregar examen"}
          </button>
        )}
      </div>
    </form>
  );
}
