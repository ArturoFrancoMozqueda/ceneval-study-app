import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { getExamAttemptHistory } from "@/lib/data/exam-history";

export const metadata: Metadata = {
  title: "Historial de exámenes",
  description: "Resultados de tus intentos de examen, del más reciente al anterior.",
};

function formatAttemptDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export default async function ExamHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ antes?: string | string[] }>;
}) {
  const params = await searchParams;
  const cursor = typeof params.antes === "string" ? params.antes : undefined;
  const history = await getExamAttemptHistory(cursor);

  return (
    <div>
      <header className="max-w-3xl">
        <Link className="text-sm font-semibold text-brand" href="/progreso">
          Progreso por materia
        </Link>
        <p className="mt-5 text-sm font-semibold text-success">
          Registro de resultados
        </p>
        <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
          Historial de exámenes
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Revisa cada intento sin perder los anteriores. Un examen histórico
          conserva su resultado, aunque su versión o su clase ya no estén
          disponibles para estudiar.
        </p>
      </header>

      {history.items.length ? (
        <>
          <section aria-labelledby="intentos-guardados" className="mt-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold" id="intentos-guardados">
                Intentos guardados
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Se muestran primero las entregas más recientes.
              </p>
            </div>

            <ol className="mt-6 grid gap-5">
              {history.items.map((attempt) => (
                <li key={attempt.attemptRef}>
                  <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div
                      className={`border-l-4 p-5 sm:p-6 ${
                        attempt.status === "current"
                          ? "border-success"
                          : "border-warning"
                      }`}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-background px-3 py-1 font-mono text-xs font-semibold text-foreground">
                              {attempt.curriculumCode}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                attempt.status === "current"
                                  ? "text-success"
                                  : "text-warning"
                              }`}
                            >
                              {attempt.status === "current"
                                ? "Examen vigente"
                                : "Examen histórico"}
                            </span>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold">
                            {attempt.examTitle}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {attempt.classTitle} · {attempt.topicTitle}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted">
                            Entregado el{" "}
                            <time dateTime={attempt.completedAt}>
                              {formatAttemptDate(attempt.completedAt)}
                            </time>
                          </p>
                        </div>

                        <dl className="shrink-0 rounded-2xl bg-brand px-5 py-4 text-white sm:min-w-40 sm:text-right">
                          <dt className="text-xs font-semibold text-white/70">
                            Resultado
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold">
                            {attempt.score}/{attempt.totalQuestions}
                          </dd>
                          <dd className="mt-1 text-sm text-white/80">
                            {attempt.percentage}% de aciertos
                          </dd>
                        </dl>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                        <Link
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
                          href={`/progreso/examenes/${attempt.attemptRef}`}
                        >
                          Abrir intento
                          <ArrowRightIcon className="size-4" />
                        </Link>
                        {attempt.topicHref ? (
                          <Link
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand/20 px-5 text-sm font-semibold text-brand hover:bg-background"
                            href={attempt.topicHref}
                          >
                            Volver al tema
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </section>

          <nav
            aria-label="Páginas del historial de exámenes"
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between"
          >
            {cursor ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand/20 px-5 text-sm font-semibold text-brand hover:bg-surface"
                href="/progreso/examenes"
              >
                Volver a los más recientes
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {history.nextCursor ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
                href={`/progreso/examenes?antes=${history.nextCursor}`}
              >
                Ver intentos anteriores
              </Link>
            ) : null}
          </nav>
        </>
      ) : cursor ? (
        <div className="mt-10">
          <EmptyState
            actionHref="/progreso/examenes"
            actionLabel="Volver a los intentos recientes"
            description="No hay más entregas anteriores a la página que abriste."
            title="Llegaste al inicio de tu historial"
          />
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            actionHref="/estudiar"
            actionLabel="Elegir un tema"
            description="Cuando entregues un examen, aquí aparecerán su fecha, puntuación y vínculo al tema vigente."
            title="Aún no has entregado exámenes"
          />
        </div>
      )}
    </div>
  );
}
