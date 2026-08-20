import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { getPublishedSessions } from "@/lib/data/academic";

export const metadata: Metadata = { title: "Sesiones" };

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

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-success">Ruta completa</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Sesiones</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Recorre el plan académico en orden o localiza el destino de cada audio.
        </p>
      </header>

      <nav aria-label="Orden de sesiones" className="mt-7 flex flex-wrap gap-3">
        {[
          ["curriculum", "Orden recomendado"],
          ["audio", "Orden de audios"],
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

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold">{ordered.length} clases publicadas</h2>
          <p className="font-mono text-xs text-muted">Meta: 58</p>
        </div>
        {ordered.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {ordered.map((session) => {
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
                    <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                      Publicada
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">
                    {session.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {session.subjectName}
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    {session.audioSources.length
                      ? session.audioSources
                          .map(
                            (source) =>
                              `Audio ${String(source.audioNumber).padStart(2, "0")}${source.fragment ? ` · ${source.fragment}` : ""}`,
                          )
                          .join(" / ")
                      : "Sin audio asignado"}
                  </p>
                  <div
                    aria-label={`Progreso ${percent}%`}
                    className="mt-4 h-2 overflow-hidden rounded-full bg-background"
                  >
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {percent}% completado
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
