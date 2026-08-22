import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { MarketingShell } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Precio de la suscripción de Sube Legal a la biblioteca completa para el examen CENEVAL EGEL de Derecho.",
};

const included = [
  "Las 57 clases del temario completo, organizadas por nivel.",
  "513 materiales de estudio por tema: explicación completa, fundamento legal, ejemplos y resúmenes.",
  "57 mapas conceptuales.",
  "685 flashcards con repaso espaciado.",
  "57 exámenes de práctica con 570 reactivos en total, calificados en el servidor.",
  "Fuentes jurídicas primarias y oficiales, con fecha de consulta, en cada tema.",
  "Progresión por nivel: avanzas al completar el examen del nivel en curso.",
];

export default function PreciosPage() {
  return (
    <MarketingShell>
      <section className="pt-8 sm:pt-14">
        <p className="inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-success">
          Precio
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Una sola suscripción, sin planes por nivel.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          Todo el catálogo está incluido desde el primer mes. Los niveles son
          la forma en que se organiza el estudio, no una forma de cobrar más
          por avanzar.
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-border bg-white p-7 sm:p-9">
          <h2 className="text-xl font-semibold">Qué incluye</h2>
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
          <p className="mt-6 text-sm leading-6 text-muted">
            Lo que todavía no incluye la suscripción está detallado en{" "}
            <Link
              className="font-semibold text-brand"
              href="/preguntas-frecuentes"
            >
              preguntas frecuentes
            </Link>
            : no hay periodo de prueba, el banco de reactivos transversal y
            los exámenes acumulativos entre materias siguen en evaluación, y
            el catálogo cubre 57 clases, no 58.
          </p>
        </div>

        <div className="h-fit rounded-3xl bg-brand p-7 text-white sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
            Suscripción mensual
          </p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-[-0.03em]">
              $399
            </span>
            <span className="text-sm font-semibold text-white/75">
              MXN / mes
            </span>
          </p>
          <p className="mt-2 text-sm text-white/75">
            Cobro recurrente mensual. Sin periodo de prueba: en su lugar,
            hay una muestra gratuita permanente sin necesidad de cuenta.
          </p>

          <div className="mt-7 space-y-3 border-t border-white/15 pt-6 text-sm leading-6 text-white/85">
            <p>
              <span className="font-semibold text-white">Cancelación: </span>
              conservas el acceso hasta el final del periodo ya pagado; no se
              corta de inmediato.
            </p>
            <p>
              <span className="font-semibold text-white">Reembolso: </span>
              no se reembolsa la parte no usada del periodo en curso.
            </p>
            <p>
              Tu progreso, tus intentos y tus resultados nunca se borran al
              cancelar.
            </p>
          </div>

          <button
            aria-disabled="true"
            className="mt-7 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-white/15 px-6 text-sm font-semibold text-white/70"
            disabled
            title="El cobro real todavía no está disponible."
            type="button"
          >
            Suscribirme — muy pronto
          </button>
          <p className="mt-3 text-center text-xs text-white/65">
            El cobro en línea todavía no está activo. Puedes dejar registrado
            tu interés para que te avisemos cuando abra.
          </p>
          <Link
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10"
            href="/registro"
          >
            Regístrate para avisarte
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-dashed border-border bg-surface p-7 sm:p-9">
        <h2 className="text-lg font-semibold">
          ¿Todavía no quieres decidir?
        </h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted">
          Puedes leer una clase completa gratis, sin registrarte, para
          evaluar el contenido antes de suscribirte.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground hover:border-brand/30"
          href="/muestra"
        >
          Ver la clase de muestra
          <ArrowRightIcon className="size-4" />
        </Link>
      </section>

      <p className="mt-8 text-xs leading-5 text-muted">
        Al suscribirte aceptarás los{" "}
        <Link className="font-semibold text-brand" href="/terminos">
          términos de uso
        </Link>{" "}
        y el{" "}
        <Link className="font-semibold text-brand" href="/privacidad">
          aviso de privacidad
        </Link>
        .
      </p>
    </MarketingShell>
  );
}
