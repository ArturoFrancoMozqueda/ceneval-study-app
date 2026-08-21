import Link from "next/link";
import { ArrowRightIcon, BookIcon, StudyIcon } from "@/components/icons";
import type { AppRole } from "@/lib/auth";
import type { StudyOnboardingState } from "@/lib/study/onboarding";

export function FirstStudyExperience({
  fullName,
  role,
  state,
}: {
  fullName: string;
  role: AppRole;
  state: Exclude<StudyOnboardingState, { kind: "returning" }>;
}) {
  const firstName = fullName.trim().split(/\s+/)[0];

  if (state.kind === "unavailable") {
    return (
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="text-sm font-semibold text-success">Primer paso</p>
          <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
            {firstName ? `Bienvenida, ${firstName}.` : "Bienvenida."}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-muted">
            Tu ruta comienza con una materia y una sesión publicadas.
          </p>
        </header>

        <section
          aria-labelledby="biblioteca-en-preparacion"
          className="mt-8 rounded-3xl border border-dashed border-border bg-surface p-7 sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
            <BookIcon className="size-6" />
          </span>
          <h2
            className="mt-5 text-2xl"
            id="biblioteca-en-preparacion"
          >
            La primera sesión está en preparación
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            Cuando el contenido esté revisado y publicado, aquí podrás elegir
            con qué materia comenzar. Tu acceso ya está listo.
          </p>
          {role === "admin" ? (
            <Link
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
              href="/administrar"
            >
              Ir al panel editorial
              <ArrowRightIcon className="size-4" />
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  const alternatives = state.subjectChoices.filter(
    ({ subjectId }) => subjectId !== state.recommended.subjectId,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-success">Tu primera sesión</p>
        <h1 className="mt-2 text-3xl tracking-[-0.035em] sm:text-4xl">
          {firstName ? `${firstName}, elige dónde comenzar.` : "Elige dónde comenzar."}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-muted">
          Empieza con una sola sesión. La ruta te mostrará qué sigue cuando la
          termines.
        </p>
      </header>

      <section
        aria-labelledby="ruta-recomendada"
        className="mt-8 overflow-hidden rounded-3xl bg-brand text-white shadow-sm"
      >
        <div className="grid sm:grid-cols-[9rem_1fr]">
          <div className="grid min-h-36 place-items-center bg-brand-deep p-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Ruta
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold">
                {state.recommended.curriculumCode}
              </p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-white/70">
              Recomendación para comenzar
            </p>
            <h2 className="mt-2 text-2xl" id="ruta-recomendada">
              {state.recommended.subjectName}
            </h2>
            <p className="mt-2 leading-7 text-white/80">
              {state.recommended.title}
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand hover:bg-background"
              href={`/clases/${state.recommended.id}`}
            >
              Comenzar esta sesión
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {alternatives.length ? (
        <section aria-labelledby="otras-materias" className="mt-9">
          <div className="flex items-center gap-3">
            <StudyIcon className="size-6 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">Otra ruta</p>
              <h2 className="mt-1 text-2xl" id="otras-materias">
                O elige una materia
              </h2>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {alternatives.map((session) => (
              <li key={session.subjectId}>
                <Link
                  aria-label={`Comenzar ${session.subjectName} con ${session.curriculumCode}: ${session.title}`}
                  className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-surface p-5 hover:border-brand/35"
                  href={`/clases/${session.id}`}
                >
                  <span className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl bg-success-soft px-2 font-mono text-sm font-semibold text-success">
                    {session.curriculumCode}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {session.subjectName}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-sm text-muted">
                      {session.title}
                    </span>
                  </span>
                  <ArrowRightIcon className="size-5 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-7 text-sm leading-6 text-muted">
        Después podrás cambiar de materia desde la biblioteca o consultar todas
        las sesiones en el orden recomendado.
      </p>
    </div>
  );
}
