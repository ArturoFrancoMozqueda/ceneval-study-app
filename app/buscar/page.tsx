import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
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
  const topicsResult = query
    ? await supabase
        .from("topics")
        .select("id,title,description")
        .ilike("title", `%${query}%`)
        .eq("approval_status", "approved")
        .limit(30)
    : { data: [], error: null };

  if (topicsResult.error) {
    writeDependencyFailure({
      error: topicsResult.error,
      operation: "search published topics",
    });
    throw new Error("No pudimos buscar los temas. Intenta nuevamente.");
  }
  const topics = topicsResult.data ?? [];

  return (
    <div>
      <p className="text-sm font-semibold text-success">Encuentra un tema</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Buscar temas por título
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
        {topics.map((topic) => (
          <Link
            className="block rounded-xl border border-border bg-white p-5 hover:border-brand/30"
            href={`/temas/${topic.id}`}
            key={topic.id}
          >
            <span className="font-semibold text-brand">{topic.title}</span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted">
              {topic.description}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
