import type { Metadata } from "next";
import Link from "next/link";
import { FlashcardsDeck } from "@/components/flashcards-deck";
import { requireUser } from "@/lib/auth";
import { getReviewOverview } from "@/lib/data/academic";

export const metadata: Metadata = { title: "Repasar hoy" };

export default async function ReviewPage() {
  const user = await requireUser();
  const reviewOverview = await getReviewOverview(user.id);
  const cards = reviewOverview.dueCards.map((card) => ({
    id: card.id,
    question: card.question,
    answer: card.answer,
    position: card.position,
    contextLabel: [card.curriculumCode, card.topicTitle]
      .filter(Boolean)
      .join(" · "),
    contextHref: `/temas/${card.topicId}`,
  }));
  const nextReviewLabel = reviewOverview.nextReviewAt
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(new Date(reviewOverview.nextReviewAt))
    : null;

  return (
    <div>
      <nav aria-label="Ruta de navegación" className="text-sm text-muted">
        <Link className="font-semibold text-brand" href="/estudiar">
          Centro de estudio
        </Link>{" "}
        / Repasar hoy
      </nav>
      <header className="mt-7">
        <p className="text-sm font-semibold text-success">Repaso espaciado</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {cards.length
            ? `${cards.length} ${cards.length === 1 ? "tarjeta pendiente" : "tarjetas pendientes"}`
            : "Terminaste por hoy"}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          {cards.length
            ? "Empezamos por las tarjetas que marcaste como más difíciles y seguimos con las que llevan más tiempo pendientes."
            : "No hay tarjetas vencidas. Las que calificaste volverán a aparecer cuando corresponda."}
        </p>
      </header>

      {cards.length ? (
        <section aria-labelledby="review-deck-title" className="mt-9">
          <h2 className="sr-only" id="review-deck-title">
            Tarjetas para repasar
          </h2>
          <FlashcardsDeck
            allowRestart={false}
            cards={cards}
            completionHref="/estudiar"
          />
        </section>
      ) : (
        <section
          aria-labelledby="review-complete-title"
          className="mt-9 rounded-2xl border border-success/20 bg-success-soft p-6"
        >
          <h2 className="text-xl font-semibold text-success" id="review-complete-title">
            Repaso al día
          </h2>
          <p className="mt-2 leading-7 text-muted">
            {nextReviewLabel
              ? `Tu próximo repaso está programado para el ${nextReviewLabel}.`
              : "Cuando clasifiques una tarjeta, aquí aparecerá en su fecha de repaso."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            href="/estudiar"
          >
            Volver al centro de estudio
          </Link>
        </section>
      )}
    </div>
  );
}
