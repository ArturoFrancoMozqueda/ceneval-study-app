import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import {
  getClass,
  getPublishedSessionNeighbors,
  getSubject,
  getTopicsForClass,
} from "@/lib/data/academic";
import { publicationStatusLabels } from "@/lib/status-labels";

export async function ClassDetail({ classId }: { classId: number }) {
  const user = await requireUser();
  const [studyClass, topics, neighbors] = await Promise.all([
    getClass(classId),
    getTopicsForClass(classId),
    getPublishedSessionNeighbors(classId),
  ]);
  const subject = studyClass ? await getSubject(studyClass.subjectId) : null;

  if (!studyClass || !subject) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-2xl font-semibold">Clase no disponible</h1>
        <p className="mt-2 text-muted">
          Puede que todavía no esté publicada.
        </p>
        <Link className="mt-5 inline-flex text-brand" href="/materias">
          Volver a la biblioteca
        </Link>
      </section>
    );
  }

  return (
    <div>
      <nav aria-label="Migas de navegación">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <li>
            <Link className="hover:text-brand" href="/materias">
              Biblioteca
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="hover:text-brand"
              href={`/materias/${subject.id}`}
            >
              {subject.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{studyClass.title}</li>
        </ol>
      </nav>
      <header className="mt-7">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-success">
            {studyClass.curriculumCode || "Clase estructurada"}
          </p>
          {user.role === "admin" ? (
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted">
              {publicationStatusLabels[studyClass.publicationStatus]}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {studyClass.title}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {studyClass.description}
        </p>
        {studyClass.audioSources.length ? (
          <p className="mt-3 text-sm text-muted">
            Fuente: {studyClass.audioSources.map((source) =>
              `Audio ${String(source.audioNumber).padStart(2, "0")}${source.fragment ? ` (${source.fragment})` : ""}`,
            ).join(" · ")}
          </p>
        ) : null}
      </header>

      {neighbors.previous || neighbors.next ? (
        <nav
          aria-label="Recorrido de sesiones"
          className="mt-7 grid gap-3 sm:grid-cols-2"
        >
          {neighbors.previous ? (
            <Link
              className="rounded-xl border border-border bg-white p-4 text-sm font-semibold text-brand"
              href={`/clases/${neighbors.previous.id}`}
            >
              ← Anterior · {neighbors.previous.curriculum_code}
            </Link>
          ) : null}
          {neighbors.next ? (
            <Link
              className="rounded-xl border border-border bg-white p-4 text-right text-sm font-semibold text-brand sm:col-start-2"
              href={`/clases/${neighbors.next.id}`}
            >
              {neighbors.next.curriculum_code} · Siguiente →
            </Link>
          ) : null}
        </nav>
      ) : null}

      <section className="mt-9">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-success">Ruta de estudio</p>
            <h2 className="mt-1 text-2xl font-semibold">Temas de la clase</h2>
          </div>
          <p className="font-mono text-xs text-muted">{topics.length} temas</p>
        </div>
        <div className="mt-5 space-y-4">
          {topics.length ? (
            topics.map((topic, index) => (
              <Link
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
                href={`/temas/${topic.id}`}
                key={topic.id}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft font-mono text-sm font-semibold text-success">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{topic.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted">
                    {topic.description}
                  </span>
                </span>
                <span className="text-brand transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))
          ) : (
            <EmptyState
              actionHref={
                user.role === "admin"
                  ? `/clases/${studyClass.id}/temas`
                  : `/materias/${subject.id}`
              }
              actionLabel={
                user.role === "admin"
                  ? "Organizar los temas"
                  : "Volver a la materia"
              }
              description={
                user.role === "admin"
                  ? "Define y aprueba los temas para convertir esta clase en una ruta de estudio completa."
                  : "Cuando esta clase tenga temas aprobados, aparecerán aquí en el orden recomendado."
              }
              headingLevel="h3"
              title="Esta clase aún no tiene temas disponibles"
            />
          )}
        </div>
        {user.role === "admin" ? (
          <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
            <Link
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-brand"
              href={`/clases/${studyClass.id}/temas`}
            >
              Organizar temas
            </Link>
            <Link
              className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
              href={`/administrar/clases/${studyClass.id}`}
            >
              Revisar publicación
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
