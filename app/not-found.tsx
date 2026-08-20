import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-10"
    >
      <p className="font-mono text-sm font-semibold tracking-[0.14em] text-success">
        ERROR 404
      </p>
      <h1
        className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
        id="not-found-title"
      >
        Esta página no está disponible
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-muted">
        Es posible que el enlace haya cambiado o que el contenido ya no exista.
        Vuelve a la biblioteca para encontrar una materia o clase publicada.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-deep focus-visible:outline-brand"
          href="/materias"
        >
          Ir a la biblioteca
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-5 font-semibold text-brand hover:border-brand/30 focus-visible:outline-brand"
          href="/"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
