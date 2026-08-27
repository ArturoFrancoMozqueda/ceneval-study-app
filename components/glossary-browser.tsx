"use client";

import { useDeferredValue, useState } from "react";
import {
  filterGlossaryEntries,
  glossaryCategories,
  type GlossaryEntry,
} from "@/lib/glossary";

export function GlossaryBrowser({ entries }: { entries: readonly GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = filterGlossaryEntries(entries, deferredQuery);

  return (
    <div className="mt-8">
      <form className="max-w-2xl" onSubmit={(event) => event.preventDefault()}>
        <label className="text-sm font-semibold text-foreground" htmlFor="glossary-search">
          Buscar una abreviatura o significado
        </label>
        <div className="mt-2 flex gap-3">
          <input
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-white px-4 text-base placeholder:text-muted/75"
            id="glossary-search"
            name="q"
            onChange={(event) => setQuery(event.target.value.slice(0, 100))}
            placeholder="Ejemplo: SCJN o Suprema Corte"
            type="search"
            value={query}
          />
          {query ? (
            <button
              className="min-h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-brand hover:border-brand/40"
              onClick={() => setQuery("")}
              type="button"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </form>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        {results.length === entries.length && !deferredQuery.trim()
          ? `${entries.length} abreviaturas disponibles.`
          : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}.`}
      </p>

      {results.length ? (
        <div className="mt-5 space-y-9">
          {glossaryCategories.map((category) => {
            const categoryEntries = results.filter((entry) => entry.category === category);
            if (!categoryEntries.length) return null;

            return (
              <section aria-labelledby={`glosario-${category}`} key={category}>
                <h2 className="text-xl font-semibold tracking-tight text-foreground" id={`glosario-${category}`}>
                  {category}
                </h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {categoryEntries.map((entry) => (
                    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm" key={entry.abbreviation}>
                      <dt>
                        <abbr className="text-base font-bold tracking-wide text-brand no-underline" title={entry.meaning}>
                          {entry.abbreviation}
                        </abbr>
                      </dt>
                      <dd className="mt-2 text-sm leading-6 text-foreground/80">
                        {entry.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/60 p-6">
          <p className="font-semibold text-foreground">No encontramos esa abreviatura.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Prueba con la sigla, el nombre completo o una categoría como “fiscal”.
            El glosario se amplía cuando el catálogo editorial incorpora una abreviatura nueva.
          </p>
        </div>
      )}
    </div>
  );
}
