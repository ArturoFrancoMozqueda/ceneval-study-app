"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  updateFlashcardAction,
  type FlashcardForEdit,
} from "@/app/actions/academic";

export function FlashcardEditForm({
  classId,
  topicId,
  flashcard,
}: {
  classId: number;
  topicId: number;
  flashcard: FlashcardForEdit;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);

    const result = await updateFlashcardAction(
      classId,
      topicId,
      flashcard.id,
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
        Flashcard {flashcard.position}
      </p>

      <label
        className="mt-3 block text-sm font-semibold"
        htmlFor={`flashcard-question-${flashcard.id}`}
      >
        Pregunta
      </label>
      <textarea
        className={`${inputClassName} min-h-16 resize-y`}
        defaultValue={flashcard.question}
        id={`flashcard-question-${flashcard.id}`}
        name="question"
        onChange={() => {
          setError("");
          setSaved(false);
        }}
        required
      />

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor={`flashcard-answer-${flashcard.id}`}
      >
        Respuesta
      </label>
      <textarea
        className={`${inputClassName} min-h-16 resize-y`}
        defaultValue={flashcard.answer}
        id={`flashcard-answer-${flashcard.id}`}
        name="answer"
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
          {isSubmitting ? "Guardando…" : "Guardar flashcard"}
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
