import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estudiar" };

export default async function StudyPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [
    { data: topics },
    { data: progressRows },
    { count: difficultCards },
    { count: difficultChecks },
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
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("rating", ["again", "hard"]),
    supabase
      .from("quick_check_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("needs_review", true),
  ]);
  const progressByTopic = new Map(
    (progressRows ?? []).map((row) => [
      row.topic_id as number,
      Array.isArray(row.completed_steps) ? row.completed_steps.length : 0,
    ]),
  );
  const reviewCount = (difficultCards ?? 0) + (difficultChecks ?? 0);

  return (
    <div>
      <p className="text-sm font-semibold text-success">Centro de estudio</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        ¿Qué quieres estudiar hoy?
      </h1>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white p-6">
          <p className="text-xl font-semibold">
            {reviewCount ? "Repaso recomendado" : "Al día"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {reviewCount
              ? `${reviewCount} respuestas difíciles para volver a practicar`
              : "No tienes conceptos marcados como difíciles"}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-white p-6">
          <p className="text-xl font-semibold">Sesiones de 5, 10 o 15 min</p>
          <p className="mt-1 text-sm text-muted">
            Elige el tiempo disponible dentro de cualquier tema
          </p>
        </article>
      </section>
      <section className="mt-9">
        <h2 className="text-2xl font-semibold">Temas disponibles</h2>
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
      </section>
    </div>
  );
}
