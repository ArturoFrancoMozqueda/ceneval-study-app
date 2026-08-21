import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { relationRows } from "../lib/data/relation-rows";

const academicSource = readFileSync(
  new URL("../lib/data/academic.ts", import.meta.url),
  "utf8",
);

function functionSource(name: string, nextName: string) {
  const start = academicSource.indexOf(`export async function ${name}(`);
  const end = academicSource.indexOf(
    `export async function ${nextName}(`,
    start,
  );
  assert.notEqual(start, -1, `No se encontro ${name}.`);
  assert.notEqual(end, -1, `No se encontro el limite de ${name}.`);
  return academicSource.slice(start, end);
}

test("normaliza relaciones uno-a-uno y uno-a-muchos sin alterar filas", () => {
  const row = { id: 1 };
  assert.deepEqual(relationRows(row), [row]);
  assert.deepEqual(relationRows([row, { id: 2 }]), [row, { id: 2 }]);
  assert.deepEqual(relationRows(null), []);
  assert.deepEqual(relationRows(undefined), []);
});

test("getSubjects obtiene conteos desde una sola consulta relacional minima", () => {
  const source = functionSource("getSubjects", "getSubject");
  assert.equal(source.match(/\.from\(/g)?.length, 1);
  assert.match(source, /\.from\("subjects"\)/);
  assert.match(source, /\.select\(subjectOverviewSelection\)/);
  assert.doesNotMatch(source, /\.from\("classes"\)|\.from\("topics"\)/);
  assert.match(
    academicSource,
    /"id,name,description,classes\(id,topics\(id\)\)"/,
  );
});

test("getClassesForSubject limita relaciones a las clases de la materia", () => {
  const source = functionSource("getClassesForSubject", "getClass");
  assert.equal(source.match(/\.from\(/g)?.length, 1);
  assert.match(source, /\.from\("classes"\)/);
  assert.match(source, /\.select\(classOverviewSelection\)/);
  assert.match(source, /\.eq\("subject_id", subjectId\)/);
  assert.doesNotMatch(source, /\.from\("transcripts"\)|\.from\("topics"\)/);
  assert.match(
    academicSource,
    /`\$\{classSelection\},transcripts\(id\),topics\(id\)`/,
  );
});
