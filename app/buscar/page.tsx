import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { relationRows } from "@/lib/data/relation-rows";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const supabase = await createServerSupabaseClient();
  const searchSelection =
    "id,title,description,classes!inner(title,curriculum_code,publication_status,subjects!inner(name))";
  const [titleResult, descriptionResult] = query
    ? await Promise.all([
        supabase
          .from("topics")
          .select(searchSelection)
          .ilike("title", `%${query}%`)
          .eq("approval_status", "approved")
          .eq("classes.publication_status", "published")
          .limit(30),
        supabase
          .from("topics")
          .select(searchSelection)
          .ilike("description", `%${query}%`)
          .eq("approval_status", "approved")
          .eq("classes.publication_status", "published")
          .limit(30),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (titleResult.error || descriptionResult.error) {
    writeDependencyFailure({
      error: titleResult.error ?? descriptionResult.error,
      operation: "search published topics",
    });
    throw new Error("No pudimos buscar los temas. Intenta nuevamente.");
  }
  const topics = Array.from(
    new Map(
      [...(titleResult.data ?? []), ...(descriptionResult.data ?? [])].map(
        (topic) => [topic.id, topic],
      ),
    ).values(),
  ).slice(0, 30);

  return (
    <div>
      <p className="text-sm font-semibold text-success">Consulta la biblioteca</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Buscar por tema o concepto
      </h1>
      <form className="mt-7 flex max-w-2xl gap-3">
        <label className="sr-only" htmlFor="search">
          Buscar temas
        </label>
        <input
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-white px-4"
          defaultValue={query}
          id="search"
          name="q"
          placeholder="Ejemplo: control constitucional"
          type="search"
        />
        <button
          className="rounded-xl bg-brand px-5 font-semibold text-white"
          type="submit"
        >
          Buscar
        </button>
      </form>
      <section aria-live="polite" className="mt-8 space-y-3">
        {!query ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">¿Qué necesitas repasar?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Escribe un concepto jurídico o el nombre de un tema. Buscaremos
              tanto en el título como en su descripción.
            </p>
          </div>
        ) : null}
        {query && topics.length ? (
          <h2 className="text-lg font-semibold">
            {topics.length} {topics.length === 1 ? "resultado" : "resultados"}
            {topics.length === 30 ? " (se muestran los primeros 30)" : ""}
          </h2>
        ) : null}
        {query && !topics?.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-muted">
            No encontramos temas publicados para “{query}”.
          </p>
        ) : null}
        {topics.map((topic) => {
          const studyClass = relationRows(topic.classes)[0];
          const subject = relationRows(studyClass?.subjects)[0];
          return (
            <Link
              className="block rounded-xl border border-border bg-white p-5 hover:border-brand/30"
              href={`/temas/${topic.id}`}
              key={topic.id}
            >
              <span className="font-semibold text-brand">{topic.title}</span>
              <span className="mt-1 block text-xs font-semibold text-success">
                {[subject?.name, studyClass?.curriculum_code, studyClass?.title]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="mt-1 line-clamp-2 block text-sm text-muted">
                {topic.description}
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
