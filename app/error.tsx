"use client";

import Link from "next/link";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section
      aria-labelledby="error-title"
      className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-10"
      role="alert"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-danger">
        No pudimos abrir esta sección
      </p>
      <h1
        className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
        id="error-title"
      >
        Ocurrió un problema inesperado
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-muted">
        No pudimos cargar el contenido. Puede ser un problema temporal: intenta
        otra vez o vuelve al inicio para continuar estudiando.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-deep focus-visible:outline-brand"
          onClick={() => retry()}
          type="button"
        >
          Intentar nuevamente
        </button>
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
