import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { getReviewOverview } from "@/lib/data/academic";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estudiar" };

export default async function StudyPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [
    { data: topics },
    { data: progressRows },
    reviewOverview,
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
    getReviewOverview(user.id),
  ]);
  const progressByTopic = new Map(
    (progressRows ?? []).map((row) => [
      row.topic_id as number,
      Array.isArray(row.completed_steps) ? row.completed_steps.length : 0,
    ]),
  );
  const dueCount = reviewOverview.dueCards.length;
  const nextReviewLabel = reviewOverview.nextReviewAt
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(new Date(reviewOverview.nextReviewAt))
    : null;

  return (
    <div>
      <p className="text-sm font-semibold text-success">Centro de estudio</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        ¿Qué quieres estudiar hoy?
      </h1>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl font-semibold">
            {dueCount ? "Repaso listo" : "Al día por hoy"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {reviewOverview.currentDifficultCount
              ? `${reviewOverview.currentDifficultCount} conceptos necesitan refuerzo según tu respuesta más reciente.`
              : "No tienes conceptos marcados actualmente para reforzar."}
          </p>
          {dueCount ? (
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
              href="/estudiar/repaso"
            >
              Repasar {dueCount} {dueCount === 1 ? "tarjeta" : "tarjetas"}
            </Link>
          ) : nextReviewLabel ? (
            <p className="mt-4 text-xs font-semibold text-success">
              Próximo repaso: {nextReviewLabel}
            </p>
          ) : null}
        </article>
        <article className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl font-semibold">Sesiones de 5, 10 o 15 min</h2>
          <p className="mt-1 text-sm text-muted">
            Elige el tiempo disponible dentro de cualquier tema
          </p>
        </article>
      </section>
      <section className="mt-9">
        <h2 className="text-2xl font-semibold">Temas disponibles</h2>
        {(topics ?? []).length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(topics ?? []).map((topic) => {
              const completed = progressByTopic.get(topic.id as number) ?? 0;
              const status =
                completed >= 5
                  ? "Dominado"
                  : completed > 0
                    ? "En práctica"
                    : "Por comenzar";
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
      </section>
    </div>
  );
}
