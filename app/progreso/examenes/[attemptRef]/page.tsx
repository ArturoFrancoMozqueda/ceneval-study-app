import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExamAttemptDetail } from "@/lib/data/exam-history";

export const metadata: Metadata = {
  title: "Detalle del intento",
  description: "Tus respuestas guardadas en un intento de examen.",
};

function formatAttemptDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptRef: string }>;
}) {
  const { attemptRef } = await params;
  const attempt = await getExamAttemptDetail(attemptRef);
  if (!attempt) notFound();

  return (
    <div>
      <header className="max-w-3xl">
        <Link
          className="text-sm font-semibold text-brand"
          href="/progreso/examenes"
        >
          Historial de exámenes
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface px-3 py-1 font-mono text-xs font-semibold">
            {attempt.curriculumCode}
          </span>
          <span
            className={`text-xs font-semibold ${
              attempt.status === "current" ? "text-success" : "text-warning"
            }`}
          >
            {attempt.status === "current"
              ? "Examen vigente"
              : "Examen histórico"}
          </span>
        </div>
        <h1 className="mt-3 text-3xl tracking-[-0.035em] sm:text-4xl">
          {attempt.examTitle}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {attempt.classTitle} · {attempt.topicTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Entregado el{" "}
          <time dateTime={attempt.completedAt}>
            {formatAttemptDate(attempt.completedAt)}
          </time>
        </p>
      </header>

      <section
        aria-labelledby="resultado-intento"
        className="mt-8 rounded-3xl bg-brand p-6 text-white sm:p-8"
      >
        <h2 className="text-sm font-semibold text-white/70" id="resultado-intento">
          Resultado de este intento
        </h2>
        <p className="mt-3 text-4xl font-semibold">
          {attempt.score}/{attempt.totalQuestions}
        </p>
        <p className="mt-2 text-white/80">
          {attempt.percentage}% de respuestas correctas
        </p>
      </section>

      <section aria-labelledby="respuestas-intento" className="mt-10">
        <h2 className="text-2xl font-semibold" id="respuestas-intento">
          Tus respuestas
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Este registro muestra únicamente la opción que elegiste y si fue
          correcta. No revela otras opciones ni claves de respuesta.
        </p>

        <ol className="mt-6 grid gap-4">
          {attempt.responses.map((response, index) => (
            <li key={response.questionId}>
              <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <p
                  className={`text-sm font-semibold ${
                    response.isCorrect ? "text-success" : "text-danger"
                  }`}
                >
                  Pregunta {index + 1} ·{" "}
                  {response.isCorrect ? "Respuesta correcta" : "Necesita repaso"}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-7">
                  {response.question}
                </h3>
                <div className="mt-4 rounded-xl bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Tu respuesta
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {response.selectedOption}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <nav
        aria-label="Acciones para este intento"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        {attempt.topicHref ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            href={attempt.topicHref}
          >
            Volver al tema y repetir
          </Link>
        ) : (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            href="/estudiar"
          >
            Elegir un tema vigente
          </Link>
        )}
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand/20 px-5 text-sm font-semibold text-brand hover:bg-surface"
          href="/progreso/examenes"
        >
          Volver al historial
        </Link>
      </nav>
    </div>
  );
}
