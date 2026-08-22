import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  deriveAdminCatalog,
  type AdminCatalogRow,
} from "../lib/data/admin-catalog";
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

test("deriveAdminCatalog transforma 25 materias y 57 clases con orden y forma minimos", () => {
  const fixture: AdminCatalogRow[] = Array.from(
    { length: 25 },
    (_, subjectIndex) => ({
      id: subjectIndex + 1,
      name: `Materia ${String(subjectIndex + 1).padStart(2, "0")}`,
      classes: Array.from({ length: 57 }, (_, classIndex) => classIndex + 1)
        .filter((classId) => (classId - 1) % 25 === subjectIndex)
        .map((classId) => ({
          id: classId,
          title: `Clase ${String(classId).padStart(2, "0")}`,
          publication_status: classId % 2 === 0 ? "published" : "draft",
          published_at: classId % 2 === 0 ? "2026-08-21T00:00:00Z" : null,
          created_at: "2026-08-20T00:00:00Z",
          topics: Array.from(
            { length: (classId % 3) + 1 },
            (_, topicIndex) => ({
              id: classId * 10 + topicIndex,
            }),
          ),
        })),
    }),
  );
  const catalog = deriveAdminCatalog(fixture);
  const classes = catalog.flatMap((group) => group.classes);

  assert.equal(catalog.length, 25);
  assert.equal(classes.length, 57);
  assert.equal(
    catalog.reduce((total, group) => total + group.subject.classCount, 0),
    57,
  );
  assert.deepEqual(
    catalog.map((group) => group.subject.id),
    fixture.map((row) => row.id),
  );
  assert.deepEqual(
    classes.map((row) => row.id),
    fixture.flatMap((row) => relationRows(row.classes).map((item) => item.id)),
  );
  fixture.forEach((row, index) => {
    const expectedClasses = relationRows(row.classes);
    assert.equal(catalog[index]?.subject.classCount, expectedClasses.length);
    assert.equal(
      catalog[index]?.subject.topicCount,
      expectedClasses.reduce(
        (total, classRow) => total + relationRows(classRow.topics).length,
        0,
      ),
    );
  });
  assert.deepEqual(Object.keys(classes[0] ?? {}).sort(), [
    "id",
    "publicationStatus",
    "title",
    "topicCount",
  ]);
  assert.deepEqual(Object.keys(catalog[0]?.subject ?? {}).sort(), [
    "classCount",
    "id",
    "name",
    "topicCount",
  ]);
  assert.equal("published_at" in (classes[0] ?? {}), false);
  assert.equal("created_at" in (classes[0] ?? {}), false);

  const singular = deriveAdminCatalog([
    {
      id: 99,
      name: "Relacion singular",
      classes: {
        id: 999,
        title: "Clase singular",
        publication_status: "review",
        published_at: null,
        created_at: "2026-08-21T00:00:00Z",
        topics: { id: 1 },
      },
    },
  ]);
  assert.equal(singular[0]?.subject.topicCount, 1);
  assert.equal(singular[0]?.classes[0]?.topicCount, 1);
});

test("getAdminCatalog mantiene una sola consulta relacional y API sin inyeccion", () => {
  const source = functionSource("getAdminCatalog", "getSubjects");
  assert.doesNotMatch(source, /client\??:|AdminCatalogQueryClient/);
  assert.equal(source.match(/\.from\(/g)?.length, 1);
  assert.equal(source.match(/\.select\(/g)?.length, 1);
  assert.match(source, /\.from\("subjects"\)/);
  assert.match(source, /\.select\(adminCatalogSelection\)/);
  assert.doesNotMatch(source, /for \(|Promise\.all|\.from\("classes"\)/);
  assert.match(source, /return deriveAdminCatalog\(/);
  assert.match(
    academicSource,
    /"id,name,classes\(id,title,publication_status,published_at,created_at,topics\(id\)\)"/,
  );
  assert.doesNotMatch(
    academicSource.match(/const adminCatalogSelection =[\s\S]*?;\r?\n/)?.[0] ?? "",
    /teacher|class_date|description|curriculum|audio_sources/,
  );
  assert.doesNotMatch(source, /select\(["'`]\*|select\(["'`][^"'`]*,\*/);
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
    /`\$\{classSelection\},topics\(id\)`/,
  );
});
