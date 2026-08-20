"use client";

import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <title>Error | CENEVAL Study App</title>
        <main className="grid min-h-screen place-items-center px-5 py-10">
          <section
            aria-labelledby="global-error-title"
            className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-10"
            role="alert"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-danger">
              La aplicación necesita recuperarse
            </p>
            <h1
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              id="global-error-title"
            >
              No pudimos mostrar tu espacio de estudio
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-muted">
              No pudimos cargar la aplicación. Puede ser un problema temporal:
              intenta otra vez o regresa al inicio.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-deep focus-visible:outline-brand"
                onClick={() => unstable_retry()}
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
        </main>
      </body>
    </html>
  );
}
