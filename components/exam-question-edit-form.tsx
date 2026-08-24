"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  updateExamQuestionAction,
  type ExamQuestionForEdit,
} from "@/app/actions/academic";

const difficultyLabels: Record<ExamQuestionForEdit["difficulty"], string> = {
  basic: "Básica",
  intermediate: "Intermedia",
  advanced: "Avanzada",
};

export function ExamQuestionEditForm({
  classId,
  topicId,
  question,
}: {
  classId: number;
  topicId: number;
  question: ExamQuestionForEdit;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const correctPosition =
    question.options.find((option) => option.id === question.correctOptionId)
      ?.position ?? 1;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const result = await updateExamQuestionAction(
      classId,
      topicId,
      question.id,
      new FormData(event.currentTarget),
    );
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const inputClassName =
    "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base leading-6 text-foreground focus:border-brand";

  return (
    <form
      className="rounded-2xl border border-border bg-white p-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="font-mono text-xs text-muted">
        Pregunta {question.position} · dificultad actual:{" "}
        {difficultyLabels[question.difficulty]}
      </p>

      <label
        className="mt-3 block text-sm font-semibold"
        htmlFor={`question-text-${question.id}`}
      >
        Texto de la pregunta
      </label>
      <textarea
        className={`${inputClassName} min-h-24 resize-y`}
        defaultValue={question.questionText}
        id={`question-text-${question.id}`}
        maxLength={600}
        name="questionText"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor={`question-difficulty-${question.id}`}
      >
        Dificultad
      </label>
      <select
        className={inputClassName}
        defaultValue={question.difficulty}
        id={`question-difficulty-${question.id}`}
        name="difficulty"
      >
        <option value="basic">Básica</option>
        <option value="intermediate">Intermedia</option>
        <option value="advanced">Avanzada</option>
      </select>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">
          Opciones y explicación de cada una
        </legend>
        <p className="mt-1 text-xs text-muted">
          Marca cuál es la correcta.
        </p>
        <div className="mt-3 space-y-4">
          {question.options.map((option, index) => {
            const optionNumber = index + 1;
            return (
              <div
                className="rounded-xl border border-border p-4"
                key={option.id}
              >
                <div className="flex items-start gap-3">
                  <input
                    className="mt-3.5 size-4"
                    defaultChecked={option.position === correctPosition}
                    id={`correct-${question.id}-${optionNumber}`}
                    name="correctPosition"
                    onChange={() => {
                      setError("");
                      setSaved(false);
                    }}
                    required
                    type="radio"
                    value={optionNumber}
                  />
                  <div className="flex-1">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`correct-${question.id}-${optionNumber}`}
                    >
                      Opción {optionNumber}
                      {option.position === correctPosition
                        ? " (correcta actualmente)"
                        : ""}
                    </label>
                    <textarea
                      aria-label={`Texto de la opción ${optionNumber}`}
                      className={`${inputClassName} min-h-16 resize-y`}
                      defaultValue={option.text}
                      name={`option${optionNumber}`}
                      onChange={() => {
                        setError("");
                        setSaved(false);
                      }}
                      required
                    />
                    <label
                      className="mt-2 block text-xs font-semibold text-muted"
                      htmlFor={`explanation-${question.id}-${optionNumber}`}
                    >
                      Por qué es correcta o incorrecta
                    </label>
                    <textarea
                      className={`${inputClassName} min-h-16 resize-y`}
                      defaultValue={
                        question.optionExplanations[String(option.id)] ?? ""
                      }
                      id={`explanation-${question.id}-${optionNumber}`}
                      name={`explanation${optionNumber}`}
                      onChange={() => {
                        setError("");
                        setSaved(false);
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor={`explanation-general-${question.id}`}
      >
        Explicación general de la respuesta correcta
      </label>
      <textarea
        className={`${inputClassName} min-h-20 resize-y`}
        defaultValue={question.explanation}
        id={`explanation-general-${question.id}`}
        name="explanation"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando…" : "Guardar pregunta"}
        </button>
        <p aria-live="polite" className="text-sm">
          {error ? (
            <span className="font-medium text-danger">{error}</span>
          ) : saved ? (
            <span className="font-medium text-success">
              Cambios guardados. La revisión editorial de esta clase quedó
              pendiente de repetirse.
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
