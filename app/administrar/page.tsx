import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/auth";
import { getClassesForSubject, getSubjects } from "@/lib/data/academic";
import {
  publicationStatusLabels,
  publicationStatusPluralLabels,
} from "@/lib/status-labels";

export const metadata = { title: "Panel editorial" };

export default async function AdminPage() {
  await requireAdmin();
  const subjects = await getSubjects();
  const groups = await Promise.all(
    subjects.map(async (subject) => ({
      subject,
      classes: await getClassesForSubject(subject.id),
    })),
  );
  const classes = groups.flatMap(({ classes: subjectClasses, subject }) =>
    subjectClasses.map((studyClass) => ({ ...studyClass, subject })),
  );

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-success">Administración</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Panel editorial
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Revisa los paquetes preparados antes de mostrarlos a los estudiantes.
        </p>
      </header>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["draft", "review", "published", "withdrawn"] as const).map((status) => (
          <article
            className="rounded-2xl border border-border bg-white p-5"
            key={status}
          >
            <p className="font-mono text-2xl font-semibold">
              {classes.filter((item) => item.publicationStatus === status).length}
            </p>
            <p className="mt-1 text-sm text-muted">
              {publicationStatusPluralLabels[status]}
            </p>
          </article>
        ))}
      </section>
      <section className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Clases</h2>
          <Link className="text-sm font-semibold text-brand" href="/materias/nueva">
            Crear materia
          </Link>
        </div>
        {classes.length ? (
          <div className="mt-5 space-y-3">
            {classes.map((studyClass) => (
              <Link
                className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 hover:border-brand/30 sm:flex-row sm:items-center"
                href={`/administrar/clases/${studyClass.id}`}
                key={studyClass.id}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{studyClass.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {studyClass.subject.name} · {studyClass.topicCount} temas
                  </span>
                </span>
                <span className="self-start rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted sm:self-auto">
                  {publicationStatusLabels[studyClass.publicationStatus]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              actionHref="/materias/nueva"
              actionLabel="Crear la primera materia"
              description="Crea una materia y agrega su primera clase para iniciar el flujo de revisión y publicación."
              headingLevel="h3"
              title="Aún no hay clases para revisar"
            />
          </div>
        )}
      </section>
    </div>
  );
}
