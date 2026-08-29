import Link from "next/link";
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  StudyIcon,
  XIcon,
} from "@/components/icons";
import { MarketingShell } from "@/components/marketing-shell";

const catalogStats = [
  { label: "Clases", value: "57" },
  { label: "Materiales de estudio", value: "513" },
  { label: "Mapas conceptuales", value: "57" },
  { label: "Flashcards", value: "685" },
  { label: "Exámenes por tema", value: "57" },
  { label: "Reactivos de práctica", value: "570" },
];

const included = [
  "Las 57 clases del temario en una ruta curricular; cada examen terminado acredita una sesión sin ocultar el resto de la biblioteca.",
  "513 materiales de estudio: explicación completa, fundamento legal, ejemplos y resúmenes por tema.",
  "57 mapas conceptuales para repasar la estructura de cada clase de un vistazo.",
  "685 flashcards con repaso espaciado para memorizar lo esencial.",
  "57 exámenes de práctica con 570 reactivos, calificados en el servidor.",
  "Fuentes jurídicas primarias y oficiales, con fecha de consulta, en cada tema.",
];

const notIncluded = [
  "Periodo de prueba gratuito: en su lugar hay una muestra permanente sin necesidad de cuenta.",
  "Banco de reactivos transversal ni exámenes acumulativos entre materias: están en evaluación, no tienen fecha.",
  "Una clase 58: la biblioteca cubre 57 clases completas y trazables; no hay una 58ª clase mientras no exista una fuente académica que la respalde.",
];

export function MarketingLanding() {
  return (
    <MarketingShell>
      <section className="pt-8 sm:pt-14">
        <p className="inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-success">
          Preparación para el CENEVAL EGEL de Derecho
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Estudia derecho para tu examen de titulación, con material ya
          preparado y revisado.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          Sube Legal es una biblioteca de estudio para el examen CENEVAL EGEL
          de Derecho: 57 clases completas con materiales, mapas
          conceptuales, flashcards y exámenes de práctica, listos para
          estudiar en orden, sin tener que armar tu propio temario.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep"
            href="/precios"
          >
            Ver precio y qué incluye
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-foreground hover:border-brand/30"
            href="/muestra"
          >
            Ver una clase de muestra, gratis
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          El registro todavía no está abierto: la aplicación está en
          preparación comercial. Mientras tanto puedes revisar la muestra
          gratuita; todavía no recopilamos solicitudes ni correos de espera.
        </p>
      </section>

      <section
        aria-labelledby="para-quien"
        className="mt-16 grid gap-6 sm:grid-cols-2"
      >
        <div className="rounded-3xl border border-border bg-surface p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-success-soft text-success">
            <BookIcon className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold" id="para-quien">
            ¿Para quién es?
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Para quien está por presentar el examen CENEVAL EGEL de Derecho
            para titularse en México y quiere un temario ya organizado, en
            vez de reunir apuntes y fuentes por su cuenta.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-success-soft text-success">
            <StudyIcon className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">¿Cómo se estudia?</h2>
          <p className="mt-3 leading-7 text-muted">
            El catálogo sigue una ruta curricular clara. La app te señala dónde
            continuar y cada examen terminado acredita una sesión, pero siempre
            puedes consultar el resto de la biblioteca.
          </p>
        </div>
      </section>

      <section aria-labelledby="que-incluye" className="mt-16">
        <h2
          className="text-2xl font-semibold tracking-[-0.02em]"
          id="que-incluye"
        >
          Qué incluye la biblioteca completa
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {catalogStats.map(({ label, value }) => (
            <div
              className="rounded-2xl border border-border bg-white p-5 text-center"
              key={label}
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                {label}
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-brand">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="que-obtienes"
        className="mt-16 grid gap-8 lg:grid-cols-2"
      >
        <div>
          <h2
            className="text-2xl font-semibold tracking-[-0.02em]"
            id="que-obtienes"
          >
            Qué obtienes con la suscripción
          </h2>
          <ul className="mt-5 space-y-3">
            {included.map((item) => (
              <li className="flex items-start gap-3" key={item}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                  <CheckIcon className="size-4" />
                </span>
                <span className="leading-7 text-foreground/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            Qué no incluye todavía
          </h2>
          <p className="mt-2 text-sm text-muted">
            Preferimos decirlo con claridad ahora, no descubrirlo después de
            pagar. Detalle completo en{" "}
            <Link className="font-semibold text-brand" href="/preguntas-frecuentes">
              preguntas frecuentes
            </Link>
            .
          </p>
          <ul className="mt-5 space-y-3">
            {notIncluded.map((item) => (
              <li className="flex items-start gap-3" key={item}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
                  <XIcon className="size-4" />
                </span>
                <span className="leading-7 text-foreground/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="siguiente-paso"
        className="mt-16 rounded-3xl bg-brand px-7 py-10 text-white sm:px-10"
      >
        <h2
          className="text-2xl font-semibold tracking-[-0.02em]"
          id="siguiente-paso"
        >
          Empieza por la muestra gratuita
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-white/85">
          No pedimos tarjeta ni cuenta para que evalúes el contenido: puedes
          leer una clase completa, con su mapa conceptual y sus flashcards,
          antes de decidir si te suscribes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-brand hover:bg-white/90"
            href="/muestra"
          >
            Ver la clase de muestra
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10"
            href="/precios"
          >
            Ver precio
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
