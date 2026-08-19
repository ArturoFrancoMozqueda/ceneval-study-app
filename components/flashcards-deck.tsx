"use client";

import { useState } from "react";
import { reviewFlashcardAction } from "@/app/actions/academic";
import type { Flashcard } from "@/lib/data/academic";

const ratings = [
  { value: "again", label: "Repetir" },
  { value: "hard", label: "Difícil" },
  { value: "good", label: "Bien" },
  { value: "easy", label: "Fácil" },
] as const;

export function FlashcardsDeck({
  cards,
  onComplete,
}: {
  cards: Flashcard[];
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [ratingsCount, setRatingsCount] = useState({
    review: 0,
    mastered: 0,
  });
  const card = cards[index];

  if (!cards.length) {
    return <p className="text-muted">Esta lección aún no tiene tarjetas.</p>;
  }
  if (finished) {
    return (
      <div className="rounded-2xl bg-success-soft p-7 text-center">
        <h2 className="text-2xl font-semibold text-success">
          Repaso completado
        </h2>
        <p className="mt-2 text-muted">
          {ratingsCount.mastered} dominadas · {ratingsCount.review} para repasar.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            className="rounded-xl border border-border bg-white px-5 py-3 font-semibold"
            onClick={() => {
              setIndex(0);
              setRevealed(false);
              setFinished(false);
              setRatingsCount({ review: 0, mastered: 0 });
            }}
            type="button"
          >
            Repasar otra vez
          </button>
          {onComplete ? (
            <button
              className="rounded-xl bg-brand px-5 py-3 font-semibold text-white"
              onClick={onComplete}
              type="button"
            >
              Comprobar lo aprendido
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  async function rate(value: (typeof ratings)[number]["value"]) {
    await reviewFlashcardAction(card.id, value);
    setRatingsCount((current) => ({
      review: current.review + (value === "again" || value === "hard" ? 1 : 0),
      mastered:
        current.mastered + (value === "good" || value === "easy" ? 1 : 0),
    }));
    if (index === cards.length - 1) {
      setFinished(true);
    } else {
      setIndex((current) => current + 1);
      setRevealed(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted">
          Tarjeta {index + 1} de {cards.length}
        </p>
        <div
          aria-label={`${index + 1} de ${cards.length} tarjetas`}
          aria-valuemax={cards.length}
          aria-valuemin={1}
          aria-valuenow={index + 1}
          className="h-2 w-32 overflow-hidden rounded-full bg-border"
          role="progressbar"
        >
          <div
            className="h-full bg-success"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>
      <button
        aria-label={revealed ? "Respuesta revelada" : "Revelar respuesta"}
        className="mt-4 flex min-h-72 w-full flex-col items-center justify-center rounded-3xl border border-border bg-white p-8 text-center shadow-sm"
        onClick={() => setRevealed(true)}
        type="button"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-success">
          {revealed ? "Respuesta" : "Pregunta"}
        </span>
        <span className="mt-5 max-w-2xl text-xl font-semibold leading-8">
          {revealed ? card.answer : card.question}
        </span>
        {!revealed ? (
          <span className="mt-6 text-sm text-brand">Toca para revelar</span>
        ) : null}
      </button>
      {revealed ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ratings.map(({ label, value }) => (
            <button
              className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold hover:border-brand/30"
              key={value}
              onClick={() => rate(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
