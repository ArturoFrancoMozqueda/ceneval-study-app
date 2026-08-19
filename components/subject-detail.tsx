import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getClassesForSubject, getSubject } from "@/lib/data/academic";

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
        {classes.map((studyClass, index) => (
          <Link
            className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
            href={`/clases/${studyClass.id}`}
            key={studyClass.id}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft font-mono text-sm font-semibold text-success">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{studyClass.title}</span>
              <span className="mt-1 block text-sm text-muted">
                {studyClass.topicCount} temas
                {user.role === "admin"
                  ? ` · ${studyClass.publicationStatus}`
                  : ""}
              </span>
            </span>
            <ArrowRightIcon className="size-5 text-brand" />
          </Link>
        ))}
      </section>
    </div>
  );
}
