import Link from "next/link";
import { ArrowRightIcon, BookIcon, PlusIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getSubjects } from "@/lib/data/academic";

export async function SubjectsList() {
  const [user, subjects] = await Promise.all([requireUser(), getSubjects()]);

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-success">
            Contenido publicado
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Biblioteca CENEVAL
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Clases de Derecho organizadas para comprender, practicar y repasar.
          </p>
        </div>
        {user.role === "admin" ? (
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
            href="/materias/nueva"
          >
            <PlusIcon className="size-4" />
            Nueva materia
          </Link>
        ) : null}
      </header>

      {subjects.length ? (
        <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              aria-label={`Abrir ${subject.name}`}
              className="group flex min-h-64 flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-brand/30"
              href={`/materias/${subject.id}`}
              key={subject.id}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-success-soft text-success">
                <BookIcon />
              </span>
              <h2 className="mt-5 text-lg font-semibold">{subject.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                {subject.description}
              </p>
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <p className="font-mono text-xs text-muted">
                  {subject.classCount} clases · {subject.topicCount} temas
                </p>
                <span className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-brand">
                  Abrir
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="mt-10 rounded-3xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <BookIcon className="mx-auto size-9 text-success" />
          <h2 className="mt-5 text-xl font-semibold">
            Aún no hay clases publicadas
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted">
            La biblioteca mostrará aquí el material completo cuando esté
            revisado y publicado.
          </p>
        </section>
      )}
    </div>
  );
}
