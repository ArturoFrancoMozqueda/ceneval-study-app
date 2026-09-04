import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { getStudyPlanOverview } from "@/lib/data/study-plan";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { getTopicJourneyStatus } from "@/lib/study/progress-presentation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estudiar" };

export default async function StudyPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [
    topicsResult,
    progressResult,
    studyPlanResult,
  ] = await Promise.all([
    supabase
      .from("topics")
      .select("id,title,description,classes!inner(publication_status)")
      .eq("approval_status", "approved")
      .eq("classes.publication_status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("study_progress")
      .select("topic_id,completed_steps,last_activity_at")
      .eq("user_id", user.id),
    getStudyPlanOverview(user.id),
  ]);
  if (topicsResult.error) {
    writeDependencyFailure({
      error: topicsResult.error,
      operation: "study topics",
    });
    throw new Error("No pudimos preparar tus temas. Intenta nuevamente.");
  }
  if (progressResult.error) {
    writeDependencyFailure({
      error: progressResult.error,
      operation: "study progress",
    });
    throw new Error("No pudimos consultar tu avance. Intenta nuevamente.");
  }
  const topics = topicsResult.data;
  const progressRows = progressResult.data;
  const progressByTopic = new Map(
    (progressRows ?? []).map((row) => [
      row.topic_id as number,
      Array.isArray(row.completed_steps) ? row.completed_steps.length : 0,
    ]),
  );
  const studyPlan = studyPlanResult.overview;
  const dueCount = studyPlan.recommendedCount;
  const nextReviewLabel = studyPlan.nextReviewAt
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(new Date(studyPlan.nextReviewAt))
    : null;

  return (
    <div>
      <p className="text-sm font-semibold text-success">Práctica adaptativa</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Practica lo que más te conviene hoy
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">
        Empieza con una ronda breve. Intentarás responder antes de ver la clave y
        ajustarás el próximo repaso con una autoevaluación honesta.
      </p>
      <section className="mt-8 overflow-hidden rounded-3xl border border-brand/15 bg-brand text-white">
        <div className="grid md:grid-cols-[1fr_auto] md:items-end">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-white/65">Tu siguiente acción</p>
            <h2 className="mt-2 text-3xl">
              {dueCount ? "Tienes una ronda lista" : "Tu repaso está al día"}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">
            {studyPlan.difficultCount
              ? `${studyPlan.difficultCount} conceptos necesitan refuerzo según tu respuesta más reciente.`
              : "No tienes conceptos marcados para reforzar ahora. Puedes practicar un tema nuevo."}
          </p>
          <Link
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-brand"
            href="/estudiar/repaso"
          >
            {dueCount
              ? `Practicar ${dueCount} ${dueCount === 1 ? "pregunta" : "preguntas"}`
              : "Iniciar una ronda adaptativa"}
          </Link>
          {!dueCount && nextReviewLabel ? (
            <p className="mt-4 text-sm font-semibold text-white/75">
              Próximo repaso programado: {nextReviewLabel}
            </p>
          ) : null}
          </div>
          <div className="border-t border-white/15 px-6 py-5 md:w-56 md:border-l md:border-t-0 md:px-7 md:py-8">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/55">
              Método
            </p>
            <ol className="mt-3 space-y-2 text-sm font-semibold text-white/85">
              <li>1. Intentar</li>
              <li>2. Contrastar</li>
              <li>3. Ajustar</li>
            </ol>
          </div>
        </div>
      </section>
      <details className="mt-9 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-semibold text-brand">
          Elegir otro tema manualmente
        </summary>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          La recomendación no bloquea la biblioteca. Abre cualquier tema para
          consultar su lección, practicar o hacer el simulacro.
        </p>
        {(topics ?? []).length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(topics ?? []).map((topic) => {
              const completed = progressByTopic.get(topic.id as number) ?? 0;
              const status = getTopicJourneyStatus(completed);
              return (
                <Link
                  className="rounded-2xl border border-border bg-white p-5 hover:border-brand/30"
                  href={`/temas/${topic.id}`}
                  key={topic.id}
                >
                  <span className="text-xs font-semibold text-success">
                    {status}
                  </span>
                  <span className="mt-2 block font-semibold">{topic.title}</span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted">
                    {topic.description}
                  </span>
                  <span className="mt-4 block text-sm font-semibold text-brand">
                    Practicar ahora →
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              actionHref={user.role === "admin" ? "/administrar" : "/materias"}
              actionLabel={
                user.role === "admin"
                  ? "Ir al panel editorial"
                  : "Volver a la biblioteca"
              }
              description={
                user.role === "admin"
                  ? "Aprueba los temas de una clase publicada para que sus materiales aparezcan en el centro de estudio."
                  : "Los temas aparecerán aquí cuando estén aprobados y formen parte de una clase publicada."
              }
              headingLevel="h3"
              title="Aún no hay temas disponibles para estudiar"
            />
          </div>
        )}
      </details>
    </div>
  );
}
