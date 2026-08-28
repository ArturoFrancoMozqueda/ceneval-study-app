import type { Metadata } from "next";
import Link from "next/link";
import { AdaptivePractice } from "@/components/adaptive-practice";
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
          Práctica adaptativa de hoy
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Empezamos por preguntas nuevas o pendientes y priorizamos lo que te
          costó recuperar. Si el banco adaptativo todavía no está disponible,
          usamos tus tarjetas vencidas como respaldo.
        </p>
      </header>

      <section aria-labelledby="review-deck-title" className="mt-9">
        <h2 className="sr-only" id="review-deck-title">
          Preguntas para practicar
        </h2>
        <AdaptivePractice
          adaptive
          cards={cards}
          completionHref="/estudiar"
          completionLabel="Volver al centro de estudio"
        />
        {!cards.length && nextReviewLabel ? (
          <p className="mt-5 text-sm leading-6 text-muted">
            Tus tarjetas tradicionales volverán a estar disponibles el {nextReviewLabel}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
