import type { Metadata } from "next";
import Link from "next/link";
import { ConceptMap } from "@/components/concept-map";
import { ArrowRightIcon } from "@/components/icons";
import { MarketingShell } from "@/components/marketing-shell";
import {
  getSampleLesson,
  SAMPLE_TOPIC_ID,
  type SampleFlashcard,
} from "@/lib/data/sample-lesson";

export const metadata: Metadata = {
  title: "Muestra gratuita",
  description:
    "Lee gratis y sin cuenta una clase completa de la biblioteca de Sube Legal para el examen CENEVAL EGEL de Derecho.",
};

const sourceLabels: Record<string, string> = {
  class: "Explicado en clase",
  complementary: "Explicación complementaria",
  mixed: "Clase + fuentes complementarias",
};

function SampleFlashcards({ cards }: { cards: SampleFlashcard[] }) {
  if (!cards.length) return null;
  return (
    <section aria-labelledby="muestra-flashcards" className="mt-10">
      <h2 className="text-xl font-semibold" id="muestra-flashcards">
        Flashcards de esta clase
      </h2>
      <p className="mt-2 text-sm text-muted">
        Vista de solo lectura: en la suscripción, cada tarjeta guarda tu
        repaso para traértela de vuelta cuando toca repasarla.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <details
            className="group rounded-2xl border border-border bg-white p-5"
            key={card.id}
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none">
              <span className="text-xs font-semibold uppercase tracking-widest text-success">
                Pregunta
              </span>
              <p className="mt-2 leading-6">{card.question}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-brand group-open:hidden">
                Toca para ver la respuesta
              </span>
            </summary>
            <div className="mt-3 border-t border-border pt-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-success">
                Respuesta
              </span>
              <p className="mt-2 leading-6 text-foreground/85">
                {card.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function MuestraPage() {
  const lesson = await getSampleLesson(SAMPLE_TOPIC_ID);

  return (
    <MarketingShell>
      <p className="mt-8 inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-success">
        Muestra gratuita, sin cuenta
      </p>

      {!lesson ? (
        <div className="mt-6 max-w-2xl rounded-3xl border border-dashed border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">
            La muestra no está disponible en este momento
          </h1>
          <p className="mt-3 leading-7 text-muted">
            Estamos actualizando el contenido de muestra. Mientras tanto,
            puedes revisar el{" "}
            <Link className="font-semibold text-brand" href="/precios">
              precio y qué incluye la biblioteca
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <header className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold text-success">
              {lesson.subject.name} · {lesson.studyClass.curriculumCode}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {lesson.topic.title}
            </h1>
            {lesson.topic.description ? (
              <p className="mt-3 leading-7 text-muted">
                {lesson.topic.description}
              </p>
            ) : null}
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Material educativo para preparación académica; no constituye
              asesoría jurídica.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              Esta es una clase completa de la biblioteca de Sube Legal,
              elegida como muestra permanente. La suscripción incluye las 57
              clases del temario; esta vista no incluye el examen de
              práctica del tema, que sí forma parte de la suscripción.
            </p>
          </header>

          <section aria-labelledby="muestra-materiales" className="mt-10">
            <h2 className="text-xl font-semibold" id="muestra-materiales">
              Materiales de estudio
            </h2>
            <div className="mt-5 space-y-5">
              {lesson.materials.map((material) => (
                <article
                  className="rounded-2xl border border-border bg-white p-5 sm:p-7"
                  key={material.id}
                >
                  <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    {sourceLabels[material.sourceOrigin] ?? "Material de estudio"}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">
                    {material.title}
                  </h3>
                  <div className="mt-3 whitespace-pre-line leading-8 text-foreground/80">
                    {material.content}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {lesson.conceptMap ? (
            <section aria-labelledby="muestra-mapa" className="mt-10">
              <h2 className="sr-only" id="muestra-mapa">
                Mapa conceptual
              </h2>
              <ConceptMap
                description={lesson.conceptMap.description}
                nodes={lesson.conceptMap.nodes}
                title={lesson.conceptMap.title}
              />
            </section>
          ) : null}

          {lesson.references.length ? (
            <section aria-labelledby="muestra-fuentes" className="mt-10">
              <h2 className="text-xl font-semibold" id="muestra-fuentes">
                Fuentes jurídicas
              </h2>
              <ul className="mt-5 space-y-3">
                {lesson.references.map((reference) => (
                  <li
                    className="rounded-2xl border border-border bg-white p-5"
                    key={reference.id}
                  >
                    <a
                      className="font-semibold text-brand hover:underline"
                      href={reference.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {reference.title}
                    </a>
                    <p className="mt-1 text-sm text-muted">
                      {reference.institution}
                      {reference.jurisdiction
                        ? ` · ${reference.jurisdiction}`
                        : ""}
                    </p>
                    {reference.note ? (
                      <p className="mt-2 text-sm leading-6 text-foreground/75">
                        {reference.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <SampleFlashcards cards={lesson.flashcards} />

          <section className="mt-14 rounded-3xl bg-brand px-7 py-10 text-white sm:px-10">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">
              ¿Te sirvió esta clase?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/85">
              Esta es solo una de las 57 clases de la biblioteca completa.
              Con la suscripción tienes acceso a todas, con tu progreso
              guardado y un examen de práctica por tema.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-brand hover:bg-white/90"
                href="/precios"
              >
                Ver precio
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10"
                href="/registro"
              >
                Regístrate para avisarte
              </Link>
            </div>
          </section>
        </>
      )}
    </MarketingShell>
  );
}
