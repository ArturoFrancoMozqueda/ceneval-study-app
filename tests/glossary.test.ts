import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { filterGlossaryEntries, glossaryEntries, normalizeGlossaryQuery } from "../lib/glossary";

const browserSource = readFileSync("components/glossary-browser.tsx", "utf8");
const pageSource = readFileSync("app/glosario/page.tsx", "utf8");

test("el catálogo no repite siglas y permanece ordenado", () => {
  const abbreviations = glossaryEntries.map((entry) => entry.abbreviation);
  assert.equal(new Set(abbreviations).size, abbreviations.length);
  assert.deepEqual(abbreviations, abbreviations.toSorted((a, b) => a.localeCompare(b, "es-MX")));
});

test("la búsqueda encuentra siglas, significados y categorías sin depender de acentos", () => {
  assert.equal(normalizeGlossaryQuery("  Constitución  "), "constitucion");
  assert.deepEqual(filterGlossaryEntries(glossaryEntries, "SCJN").map((entry) => entry.abbreviation), ["SCJN"]);
  assert.ok(filterGlossaryEntries(glossaryEntries, "proteccion").length > 1);
  assert.ok(filterGlossaryEntries(glossaryEntries, "fiscal").some((entry) => entry.abbreviation === "ISR"));
});

test("la ruta es privada y la interfaz expone semántica accesible", () => {
  assert.match(pageSource, /await requireUser\(\)/);
  assert.match(browserSource, /<label[\s\S]*htmlFor="glossary-search"/);
  assert.match(browserSource, /aria-live="polite"/);
  assert.match(browserSource, /<dl/);
  assert.match(browserSource, /<abbr/);
  assert.doesNotMatch(browserSource, /dangerouslySetInnerHTML/);
});
