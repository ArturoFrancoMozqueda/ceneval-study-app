import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { getPublishedSessions } from "@/lib/data/academic";
import { deriveSessionPath } from "@/lib/study/session-path";

export const metadata: Metadata = { title: "Mi ruta" };

type SessionOrder = "curriculum" | "audio";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const order: SessionOrder = query.orden === "audio" ? "audio" : "curriculum";
  const sessions = await getPublishedSessions(user.id);
  const ordered = [...sessions].sort((a, b) => {
    if (order === "audio") {
      const audioA = a.audioSources[0]?.audioNumber ?? Number.MAX_SAFE_INTEGER;
      const audioB = b.audioSources[0]?.audioNumber ?? Number.MAX_SAFE_INTEGER;
      return audioA - audioB || (a.curriculumOrder ?? 0) - (b.curriculumOrder ?? 0);
    }
    return (a.curriculumOrder ?? 0) - (b.curriculumOrder ?? 0);
  });
  const curriculumPath = deriveSessionPath(
    [...sessions].sort(
      (a, b) => (a.curriculumOrder ?? 0) - (b.curriculumOrder ?? 0),
    ),
  );
  const statusBySession = new Map(
    curriculumPath.map(({ id, pathStatus }) => [id, pathStatus]),
  );
  const path = ordered.map((session) => ({
    ...session,
    pathStatus: statusBySession.get(session.id) ?? "upcoming",
  }));
  const current = curriculumPath.find(
    ({ pathStatus }) => pathStatus === "current",
  );
  const completedCount = curriculumPath.filter(
    ({ pathStatus }) => pathStatus === "completed",
  ).length;
  const completionPercent = curriculumPath.length
    ? Math.round((completedCount / curriculumPath.length) * 100)
    : 0;

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-success">Tu plan curricular</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Mi ruta</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Avanza en el orden recomendado. Un examen terminado acredita la
          sesión; leer el material cuenta como recorrido, no como dominio.
        </p>
      </header>

      {path.length ? (
        <section
          aria-labelledby="avance-ruta"
          className="mt-8 overflow-hidden rounded-3xl bg-brand text-white"
        >
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-white/70">Siguiente sesión</p>
              <h2 className="mt-2 text-3xl" id="avance-ruta">
                {current
                  ? `${current.curriculumCode} · ${current.title}`
                  : "Ruta curricular completada"}
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/80">
                {current
                  ? current.completedSteps >= current.totalSteps && current.totalSteps > 0
                    ? "Ya recorriste la lección. Completa su examen para demostrar lo aprendido."
                    : "Continúa con la lección, sus casos y la práctica del tema."
                  : "Terminaste los exámenes de todas las sesiones publicadas. Sigue reforzando con práctica adaptativa."}
              </p>
              <Link
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-brand"
                href={current ? `/clases/${current.id}` : "/estudiar"}
              >
                {current ? "Continuar mi ruta" : "Practicar lo aprendido"}
              </Link>
            </div>
            <div className="min-w-48 rounded-2xl bg-white/10 p-5">
              <p className="font-mono text-3xl font-semibold">{completedCount} de {curriculumPath.length}</p>
              <p className="mt-1 text-sm text-white/70">sesiones acreditadas</p>
              <div
                aria-label={`${completionPercent}% de la ruta acreditada`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={completionPercent}
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-white" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {user.role === "admin" ? (
        <nav aria-label="Orden de sesiones" className="mt-7 flex flex-wrap gap-3">
          {[
            ["curriculum", "Orden curricular"],
            ["audio", "Referencia por audio"],
          ].map(([value, label]) => (
            <Link
              aria-current={order === value ? "page" : undefined}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${order === value ? "bg-brand text-white" : "border border-border bg-white text-brand"}`}
              href={value === "audio" ? "/sesiones?orden=audio" : "/sesiones"}
              key={value}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold">Ruta completa</h2>
          <p className="font-mono text-xs text-muted">{ordered.length} sesiones</p>
        </div>
        {ordered.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {path.map((session) => {
              const percent = session.totalSteps
                ? Math.round(
                    (session.completedSteps / session.totalSteps) * 100,
                  )
                : 0;
              return (
                <Link
                  className="[content-visibility:auto] rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
                  href={`/clases/${session.id}`}
                  key={session.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-success">
                      {session.curriculumCode}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      session.pathStatus === "completed"
                        ? "bg-success-soft text-success"
                        : session.pathStatus === "current"
                          ? "bg-brand-soft text-brand"
                          : "bg-background text-muted"
                    }`}>
                      {session.pathStatus === "completed"
                        ? "Examen completado"
                        : session.pathStatus === "current"
                          ? "Sigue aquí"
                          : "Próxima"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">
                    {session.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {session.subjectName}
                  </p>
                  {user.role === "admin" ? <p className="mt-3 text-sm text-muted">
                    {session.audioSources.length
                      ? session.audioSources
                          .map(
                            (source) =>
                              `Audio ${String(source.audioNumber).padStart(2, "0")}${source.fragment ? ` · ${source.fragment}` : ""}`,
                          )
                          .join(" / ")
                      : "Sin audio asignado"}
                  </p> : null}
                  <div
                    aria-label={`Progreso ${percent}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percent}
                    className="mt-4 h-2 overflow-hidden rounded-full bg-background"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {session.examCompleted
                      ? "Dominio acreditado con un examen terminado"
                      : `${percent}% de la lección consultada`}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            actionHref={user.role === "admin" ? "/administrar" : "/materias"}
            actionLabel={
              user.role === "admin"
                ? "Ir al panel editorial"
                : "Volver a la biblioteca"
            }
            description={
              user.role === "admin"
                ? "Publica la primera clase para incorporarla al recorrido C01–C58 y comenzar a registrar el avance."
                : "Las clases aparecerán aquí cuando estén publicadas y listas para estudiar."
            }
            headingLevel="h3"
            title="Todavía no hay sesiones publicadas"
          />
        )}
      </section>
    </div>
  );
}
