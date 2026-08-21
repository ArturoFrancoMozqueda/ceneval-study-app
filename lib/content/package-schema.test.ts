import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { assertPackageCanReachSupabase } from "./import-gate";
import {
  assessEditorialGate,
  classPackageFileSchema,
  curriculumMetadataSchema,
  evidenceSchema,
} from "./package-schema";

const validCurriculum = {
  code: "C41",
  order: 41,
  audioSources: [
    { audioNumber: 54, fragment: "completo" },
    { audioNumber: 55, fragment: "primera parte" },
  ],
};

test("acepta código, orden y audios coherentes", () => {
  assert.deepEqual(
    curriculumMetadataSchema.parse(validCurriculum),
    validCurriculum,
  );
});

test("rechaza un código que no coincide con el orden", () => {
  const result = curriculumMetadataSchema.safeParse({
    ...validCurriculum,
    order: 42,
  });

  assert.equal(result.success, false);
  assert.match(result.error?.issues[0]?.message ?? "", /debe usar el orden 41/);
});

test("rechaza códigos y audios fuera del plan", () => {
  const result = curriculumMetadataSchema.safeParse({
    code: "C59",
    order: 59,
    audioSources: [{ audioNumber: 71, fragment: "completo" }],
  });

  assert.equal(result.success, false);
  assert.ok((result.error?.issues.length ?? 0) >= 3);
});

test("rechaza el mismo audio repetido dentro de una clase", () => {
  const result = curriculumMetadataSchema.safeParse({
    ...validCurriculum,
    audioSources: [
      { audioNumber: 54, fragment: "primera parte" },
      { audioNumber: 54, fragment: "segunda parte" },
    ],
  });

  assert.equal(result.success, false);
  assert.match(result.error?.issues[0]?.message ?? "", /está repetido/);
});

const legacyPackagePath = path.join(
  process.cwd(),
  "content",
  "packages",
  "audio-04-05-derecho-sustantivo-adjetivo.json",
);

function readLegacyPackage() {
  const parsed = classPackageFileSchema.parse(
    JSON.parse(readFileSync(legacyPackagePath, "utf8")),
  );
  assert.equal(parsed.packageVersion, "1.1");
  if (parsed.packageVersion !== "1.1") {
    throw new Error("La prueba requiere un paquete legado en 1.1.");
  }
  return parsed;
}

function createSyntheticTraceablePackage() {
  const legacyPackage = readLegacyPackage();
  const evidenceIds = ["ev-synthetic-source"];

  return {
    ...legacyPackage,
    packageVersion: "1.2" as const,
    evidenceRegistry: [
      {
        id: "ev-synthetic-source",
        kind: "transcript" as const,
        audioNumber: legacyPackage.curriculum.audioSources[0]!.audioNumber,
        locator: {
          type: "line_range" as const,
          startLine: 1,
          endLine: 1,
        },
      },
    ],
    topics: legacyPackage.topics.map((topic) => ({
      ...topic,
      learningJourney: {
        ...topic.learningJourney,
        openingPromptEvidenceIds: evidenceIds,
        quickChecks: topic.learningJourney.quickChecks.map((quickCheck) => ({
          ...quickCheck,
          evidenceIds,
        })),
        practicalCase: {
          ...topic.learningJourney.practicalCase,
          evidenceIds,
        },
        closingPromptEvidenceIds: evidenceIds,
        nextActivityEvidenceIds: evidenceIds,
      },
      materials: topic.materials.map((material) => ({
        ...material,
        evidenceIds,
      })),
      conceptMap: {
        ...topic.conceptMap,
        nodes: topic.conceptMap.nodes.map((node) => ({ ...node, evidenceIds })),
      },
      flashcards: topic.flashcards.map((flashcard) => ({
        ...flashcard,
        evidenceIds,
      })),
      exam: {
        ...topic.exam,
        questions: topic.exam.questions.map((question) => ({
          ...question,
          evidenceIds,
          optionEvidenceIds: question.options.map(() => evidenceIds),
          correctOptionEvidenceIds: evidenceIds,
          explanationEvidenceIds: evidenceIds,
          optionExplanationEvidenceIds: question.options.map(() => evidenceIds),
        })),
      },
    })),
  };
}

test("conserva lectura 1.1 pero la marca no trazable y no publicable", () => {
  const assessment = assessEditorialGate(readLegacyPackage());

  assert.equal(assessment.traceable, false);
  assert.equal(assessment.publishable, false);
  assert.deepEqual(
    assessment.issues.map(({ path }) => path),
    ["packageVersion"],
  );
  assert.match(assessment.issues[0]?.message ?? "", /Migra el paquete a 1\.2/);
});

test("el contrato 1.2 señala las rutas de evidencia que faltan", () => {
  const legacyPackage = readLegacyPackage();
  const result = classPackageFileSchema.safeParse({
    ...legacyPackage,
    packageVersion: "1.2",
  });

  assert.equal(result.success, false);
  const paths = result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
  assert.ok(paths.includes("evidenceRegistry"));
  assert.ok(paths.includes("topics.0.materials.0.evidenceIds"));
  assert.ok(
    paths.includes("topics.0.exam.questions.0.optionExplanationEvidenceIds"),
  );
});

test("acepta un paquete 1.2 sintético cuando todos los artefactos tienen evidencia", () => {
  const parsed = classPackageFileSchema.parse(
    createSyntheticTraceablePackage(),
  );

  assert.equal(parsed.packageVersion, "1.2");
  assert.deepEqual(assessEditorialGate(parsed), {
    traceable: true,
    publishable: true,
    issues: [],
  });
});

test("el contrato 1.2 ubica una referencia a evidencia inexistente", () => {
  const fixture = createSyntheticTraceablePackage();
  fixture.topics[0]!.materials[0]!.evidenceIds = ["ev-does-not-exist"];

  const result = classPackageFileSchema.safeParse(fixture);

  assert.equal(result.success, false);
  assert.ok(
    result.error?.issues.some(
      (issue) =>
        issue.path.join(".") === "topics.0.materials.0.evidenceIds.0" &&
        /no existe/.test(issue.message),
    ),
  );
});

test("la evidencia oficial requiere verificación no anterior a la consulta", () => {
  const result = evidenceSchema.safeParse({
    id: "ev-official-synthetic",
    kind: "official",
    title: "Fuente oficial sintética",
    url: "https://example.gob.mx/fuente",
    institution: "Institución de prueba",
    jurisdiction: "México",
    locator: "Sección de prueba",
    retrievedOn: "2026-08-21",
    verifiedOn: "2026-08-20",
  });

  assert.equal(result.success, false);
  assert.equal(result.error?.issues[0]?.path.join("."), "verifiedOn");
});

test("la evidencia de transcripción debe pertenecer a los audios curriculares", () => {
  const fixture = createSyntheticTraceablePackage();
  fixture.evidenceRegistry[0]!.audioNumber = 70;

  const result = classPackageFileSchema.safeParse(fixture);

  assert.equal(result.success, false);
  assert.ok(
    result.error?.issues.some(
      (issue) =>
        issue.path.join(".") === "evidenceRegistry.0.audioNumber" &&
        /no está declarado/.test(issue.message),
    ),
  );
});

test("el importador permite solo el contrato trazable 1.2", () => {
  assert.throws(
    () => assertPackageCanReachSupabase({ packageVersion: "1.0" }),
    /histórico.*no importable.*1\.2/,
  );
  assert.throws(
    () => assertPackageCanReachSupabase({ packageVersion: "1.1" }),
    /legible.*no es trazable ni importable/,
  );
  assert.doesNotThrow(() =>
    assertPackageCanReachSupabase({ packageVersion: "1.2" }),
  );
});

test("el script valida 1.2 antes de crear el cliente y usa una sola RPC", () => {
  const importScript = readFileSync(
    path.join(process.cwd(), "scripts", "import-content.ts"),
    "utf8",
  );
  const gatePosition = importScript.indexOf(
    "parseImportableClassPackage(loadedBundle)",
  );
  const clientPosition = importScript.indexOf("const supabase = createClient(");

  assert.ok(gatePosition >= 0);
  assert.ok(clientPosition > gatePosition);
  assert.match(importScript, /importClassPackage/);
  assert.doesNotMatch(importScript, /\.from\(/);
});
