import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { relationRows } from "@/lib/data/relation-rows";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buscar" };

type SearchResult = {
  key: string;
  title: string;
  description: string;
  href: string;
  type: "Materia" | "Clase" | "Tema";
  location: string;
};

function uniqueRows<T extends { id: number }>(rows: T[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const supabase = await createServerSupabaseClient();
  const emptyResult = { data: [], error: null };
  const [
    subjectNameResult,
    subjectDescriptionResult,
    classTitleResult,
    classDescriptionResult,
    topicTitleResult,
    topicDescriptionResult,
  ] = query
    ? await Promise.all([
        supabase
          .from("subjects")
          .select(
            "id,name,description,classes!inner(publication_status,topics!inner(approval_status))",
          )
          .ilike("name", `%${query}%`)
          .eq("classes.publication_status", "published")
          .eq("classes.topics.approval_status", "approved")
          .limit(10),
        supabase
          .from("subjects")
          .select(
            "id,name,description,classes!inner(publication_status,topics!inner(approval_status))",
          )
          .ilike("description", `%${query}%`)
          .eq("classes.publication_status", "published")
          .eq("classes.topics.approval_status", "approved")
          .limit(10),
        supabase
          .from("classes")
          .select(
            "id,title,description,curriculum_code,publication_status,subjects!inner(name),topics!inner(approval_status)",
          )
          .ilike("title", `%${query}%`)
          .eq("publication_status", "published")
          .eq("topics.approval_status", "approved")
          .limit(10),
        supabase
          .from("classes")
          .select(
            "id,title,description,curriculum_code,publication_status,subjects!inner(name),topics!inner(approval_status)",
          )
          .ilike("description", `%${query}%`)
          .eq("publication_status", "published")
          .eq("topics.approval_status", "approved")
          .limit(10),
        supabase
          .from("topics")
          .select(
            "id,title,description,classes!inner(title,curriculum_code,publication_status,subjects!inner(name))",
          )
          .ilike("title", `%${query}%`)
          .eq("approval_status", "approved")
          .eq("classes.publication_status", "published")
          .limit(20),
        supabase
          .from("topics")
          .select(
            "id,title,description,classes!inner(title,curriculum_code,publication_status,subjects!inner(name))",
          )
          .ilike("description", `%${query}%`)
          .eq("approval_status", "approved")
          .eq("classes.publication_status", "published")
          .limit(20),
      ])
    : [emptyResult, emptyResult, emptyResult, emptyResult, emptyResult, emptyResult];

  const failures = [
    subjectNameResult.error,
    subjectDescriptionResult.error,
    classTitleResult.error,
    classDescriptionResult.error,
    topicTitleResult.error,
    topicDescriptionResult.error,
  ].filter(Boolean);
  if (failures.length) {
    writeDependencyFailure({
      error: failures[0],
      operation: "search published library",
    });
    throw new Error("No pudimos buscar en la biblioteca. Intenta nuevamente.");
  }

  const subjects = uniqueRows([
    ...(subjectNameResult.data ?? []),
    ...(subjectDescriptionResult.data ?? []),
  ]);
  const classes = uniqueRows([
    ...(classTitleResult.data ?? []),
    ...(classDescriptionResult.data ?? []),
  ]);
  const topics = uniqueRows([
    ...(topicTitleResult.data ?? []),
    ...(topicDescriptionResult.data ?? []),
  ]);
  const results: SearchResult[] = [
    ...subjects.map((subject) => ({
      key: `subject-${subject.id}`,
      title: String(subject.name),
      description: String(subject.description ?? ""),
      href: `/materias/${subject.id}`,
      type: "Materia" as const,
      location: "Biblioteca",
    })),
    ...classes.map((studyClass) => {
      const subject = relationRows(studyClass.subjects)[0];
      return {
        key: `class-${studyClass.id}`,
        title: String(studyClass.title),
        description: String(studyClass.description ?? ""),
        href: `/clases/${studyClass.id}`,
        type: "Clase" as const,
        location: [subject?.name, studyClass.curriculum_code]
          .filter(Boolean)
          .join(" · "),
      };
    }),
    ...topics.map((topic) => {
      const studyClass = relationRows(topic.classes)[0];
      const subject = relationRows(studyClass?.subjects)[0];
      return {
        key: `topic-${topic.id}`,
        title: String(topic.title),
        description: String(topic.description ?? ""),
        href: `/temas/${topic.id}`,
        type: "Tema" as const,
        location: [subject?.name, studyClass?.curriculum_code, studyClass?.title]
          .filter(Boolean)
          .join(" · "),
      };
    }),
  ].slice(0, 30);

  return (
    <div>
      <p className="text-sm font-semibold text-success">Consulta la biblioteca</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Buscar en todo el contenido
      </h1>
      <form className="mt-7 flex max-w-2xl gap-3" role="search">
        <label className="sr-only" htmlFor="search">
          Buscar materias, clases o temas
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
              Escribe un concepto, una materia, una clase o un tema. Cada
              resultado indica qué tipo de contenido es y dónde se encuentra.
            </p>
          </div>
        ) : null}
        {query && results.length ? (
          <h2 className="text-lg font-semibold">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
            {results.length === 30 ? " (se muestran los primeros 30)" : ""}
          </h2>
        ) : null}
        {query && !results.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-muted">
            No encontramos contenido publicado para “{query}”.
          </p>
        ) : null}
        {results.map((result) => (
          <Link
            className="block rounded-xl border border-border bg-white p-5 hover:border-brand/30"
            href={result.href}
            key={result.key}
          >
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {result.type}
            </span>
            <span className="mt-3 block font-semibold text-brand">
              {result.title}
            </span>
            {result.location ? (
              <span className="mt-1 block text-xs font-semibold text-success">
                {result.location}
              </span>
            ) : null}
            {result.description ? (
              <span className="mt-1 line-clamp-2 block text-sm text-muted">
                {result.description}
              </span>
            ) : null}
          </Link>
        ))}
      </section>
    </div>
  );
}
