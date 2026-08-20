"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ExamHistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section aria-labelledby="history-error-title" role="alert">
      <p className="text-sm font-semibold text-danger">No se pudo cargar</p>
      <h1 className="mt-2 text-3xl" id="history-error-title">
        Tu historial no está disponible ahora
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">
        Vuelve a intentarlo. Si abriste una página antigua, también puedes
        regresar a tus intentos más recientes.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
          onClick={reset}
          type="button"
        >
          Intentar nuevamente
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand/20 px-5 text-sm font-semibold text-brand hover:bg-surface"
          href="/progreso/examenes"
        >
          Ver intentos recientes
        </Link>
      </div>
    </section>
  );
}
