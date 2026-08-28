import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type {
  SubjectProgress,
  SubjectProgressOverview as SubjectProgressOverviewData,
} from "@/lib/study/subject-progress";

function formatLastActivity(value: string | null) {
  if (!value) return "Sin actividad registrada";
  return `Actividad más reciente: ${new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(new Date(value))}`;
}

function ExamEvidence({ subject }: { subject: SubjectProgress }) {
  if (subject.examAccuracyPercent === null) {
    return (
      <>
        <dd className="mt-1 text-base font-semibold">Sin intentos</dd>
        <dd className="mt-1 text-xs leading-5 text-muted">
          No hay un examen vigente finalizado.
        </dd>
      </>
    );
  }

  return (
    <>
      <dd className="mt-1 text-base font-semibold">
        {subject.correctExamAnswers} de {subject.answeredExamQuestions} aciertos
      </dd>
      <dd className="mt-1 text-xs leading-5 text-muted">
        {subject.examAccuracyPercent}% en {subject.completedExamAttempts}{" "}
        {subject.completedExamAttempts === 1
          ? "intento finalizado"
          : "intentos finalizados"}
        .
      </dd>
    </>
  );
}

export function SubjectProgressOverview({
  overview,
}: {
  overview: SubjectProgressOverviewData;
}) {
  return (
    <div>
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-success">Registro de avance</p>
        <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
          Progreso por materia
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Compara tu cobertura con el contenido publicado y revisa la evidencia
          real que ya generaste al estudiar.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
          href="/progreso/examenes"
        >
          Ver historial de exámenes
          <ArrowRightIcon className="size-4" />
        </Link>
      </header>

      <section
        aria-labelledby="resumen-progreso"
        className="mt-8 rounded-3xl bg-brand p-6 text-white sm:p-8"
      >
        <h2 className="text-sm font-semibold text-white/70" id="resumen-progreso">
          Cobertura general
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-white/70">Temas publicados</dt>
            <dd className="mt-1 text-3xl font-semibold">{overview.totalTopics}</dd>
          </div>
          <div>
            <dt className="text-sm text-white/70">Con actividad</dt>
            <dd className="mt-1 text-3xl font-semibold">
              {overview.startedTopics} de {overview.totalTopics}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-white/70">Finalizados</dt>
            <dd className="mt-1 text-3xl font-semibold">
              {overview.completedTopics} de {overview.totalTopics}
            </dd>
          </div>
        </dl>
      </section>

      <aside className="mt-6 rounded-2xl border border-success/20 bg-success-soft/55 p-5">
        <h2 className="text-lg font-semibold">Cómo se calculan las cifras</h2>
        <p className="mt-2 text-sm leading-6 text-foreground/80">
          El total incluye solo temas aprobados de clases publicadas. “Con
          actividad” significa que existe progreso guardado; “finalizado”, que
          completaste los tres pasos de su lección. La práctica y el simulacro
          aportan evidencia aparte; los exámenes cuentan aciertos y preguntas de
          intentos finalizados del examen vigente.
        </p>
      </aside>

      <section aria-labelledby="detalle-materias" className="mt-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold" id="detalle-materias">
            Detalle por materia
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Primero aparecen las materias con actividad más reciente; después,
            las que todavía no has comenzado.
          </p>
        </div>

        {overview.subjects.length ? (
          <ol className="mt-5 grid gap-5">
            {overview.subjects.map((subject) => (
              <li key={subject.subjectId}>
                <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="border-l-4 border-success p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {subject.subjectName}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {formatLastActivity(subject.lastActivityAt)}
                        </p>
                      </div>
                      <Link
                        className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-brand/20 px-4 text-sm font-semibold text-brand hover:bg-background"
                        href={`/materias/${subject.subjectId}`}
                      >
                        Ver materia
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </div>

                    <div className="mt-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold">
                          {subject.completedTopics} de {subject.totalTopics} temas
                          finalizados
                        </p>
                        <p className="text-sm text-muted">
                          {subject.pendingTopics} pendientes
                        </p>
                      </div>
                      <progress
                        aria-label={`${subject.subjectName}: ${subject.completedTopics} de ${subject.totalTopics} temas finalizados`}
                        className="mt-3 h-2 w-full overflow-hidden rounded-full accent-success"
                        max={subject.totalTopics}
                        value={subject.completedTopics}
                      >
                        {subject.completedTopics} de {subject.totalTopics}
                      </progress>
                    </div>

                    <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                          Actividad de estudio
                        </dt>
                        <dd className="mt-1 text-base font-semibold">
                          {subject.startedTopics} de {subject.totalTopics} temas
                        </dd>
                        <dd className="mt-1 text-xs leading-5 text-muted">
                          El denominador es todo el contenido publicado.
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                          Exámenes vigentes
                        </dt>
                        <ExamEvidence subject={subject} />
                      </div>
                    </dl>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <h3 className="text-xl font-semibold">Aún no hay temas publicados</h3>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-muted">
              El progreso aparecerá cuando exista contenido disponible para
              estudiar.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
