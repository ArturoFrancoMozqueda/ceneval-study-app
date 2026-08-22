import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ArrowRightIcon, PlusIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getClassesForSubject, getSubject } from "@/lib/data/academic";
import { publicationStatusLabels } from "@/lib/status-labels";

export async function SubjectDetail({ subjectId }: { subjectId: number }) {
  const [user, subject, classes] = await Promise.all([
    requireUser(),
    getSubject(subjectId),
    getClassesForSubject(subjectId),
  ]);

  if (!subject) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-2xl font-semibold">Materia no disponible</h1>
        <Link className="mt-5 inline-flex text-brand" href="/materias">
          Volver a la biblioteca
        </Link>
      </section>
    );
  }

  return (
    <div>
      <nav className="text-sm text-muted">
        <Link className="hover:text-brand" href="/materias">
          Biblioteca
        </Link>{" "}
        / {subject.name}
      </nav>
      <header className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-success">Materia</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {subject.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            {subject.description}
          </p>
        </div>
        {user.role === "admin" ? (
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
            href={`/materias/${subject.id}/clases/nueva`}
          >
            <PlusIcon className="size-4" />
            Nueva clase
          </Link>
        ) : null}
      </header>
      <section className="mt-9 space-y-4">
        {classes.length ? (
          classes.map((studyClass) => (
            <Link
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
              href={`/clases/${studyClass.id}`}
              key={studyClass.id}
            >
              <span className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl bg-success-soft px-2 font-mono text-sm font-semibold text-success">
                {studyClass.curriculumCode || "Sin código"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{studyClass.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {studyClass.topicCount} temas
                  {user.role === "admin"
                    ? ` · ${publicationStatusLabels[studyClass.publicationStatus]}`
                    : ""}
                </span>
              </span>
              <ArrowRightIcon className="size-5 text-brand" />
            </Link>
          ))
        ) : (
          <EmptyState
            actionHref={
              user.role === "admin"
                ? `/materias/${subject.id}/clases/nueva`
                : "/materias"
            }
            actionLabel={
              user.role === "admin"
                ? "Crear la primera clase"
                : "Volver a la biblioteca"
            }
            description={
              user.role === "admin"
                ? "Agrega una clase para organizar sus temas y preparar el material editorial."
                : "Cuando haya una clase publicada en esta materia, podrás abrir sus temas y materiales desde aquí."
            }
            title={
              user.role === "admin"
                ? "Esta materia aún no tiene clases"
                : "No hay clases publicadas"
            }
          />
        )}
      </section>
    </div>
  );
}
