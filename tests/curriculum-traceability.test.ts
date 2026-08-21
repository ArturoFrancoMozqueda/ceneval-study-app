import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  classPackageFileSchema,
  importableClassPackageSchema,
} from "../lib/content/package-schema";
import {
  assertClassPackageRoundTrip,
  countClassPackage,
} from "../lib/content/package-roundtrip";

const traceablePackages = [
  {
    code: "C01",
    fileName: "audio-01-02-orientacion-egel-derecho.json",
    artifacts: 139,
    evidence: 12,
    forbiddenClaims: [],
    requiredClaims: [],
  },
  {
    code: "C02",
    fileName: "audio-04-05-derecho-sustantivo-adjetivo.json",
    artifacts: 130,
    evidence: 17,
    forbiddenClaims: [
      /código federal de procedimientos civiles/i,
      /\bCFPC\b/i,
      /(?:método|proceso|procedimiento)(?:\s+\w+){0,3}\s+(?:de\s+)?siete pasos/i,
      /\b(?:sucesi(?:ón|ones)|sucesorio|testamentario|intestado|herederos?)\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C03",
    fileName: "audio-05-14-15-jurisdiccion-competencia.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /no pueden interpretar la constitución/i,
      /ejecutoria\s+34098/i,
      /\b(?:todos?|cualquier)\s+(?:los\s+)?incidentes?\s+suspenden?/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C04",
    fileName: "audio-18-poder-judicial-local.json",
    artifacts: 133,
    evidence: 12,
    forbiddenClaims: [
      /michoacán/i,
      /ley orgánica del poder judicial del estado de michoacán/i,
      /\b100\s+UMA\b/i,
      /\b(?:toda|cualquier)\s+sentencia\s+(?:es|será)\s+apelable\b/i,
    ],
    requiredClaims: [],
  },
  {
    code: "C05",
    fileName: "audio-56-57-resoluciones-judiciales.json",
    artifacts: 137,
    evidence: 14,
    forbiddenClaims: [/ejecutoria\s+22318/i, /\b1000710\b/],
    requiredClaims: [
      /procesos civiles y familiares/i,
      /aplicación gradual/i,
      /esta clasificación es propia del código nacional: en otras materias debe consultarse la legislación correspondiente/i,
      /no es una fórmula obligatoria universal/i,
    ],
  },
  {
    code: "C06",
    fileName: "audio-05-06-controversia-constitucional.json",
    artifacts: 137,
    evidence: 18,
    forbiddenClaims: [/última reforma DOF 03-04-2025/i],
    requiredClaims: [
      /nueve (?:integrantes|ministras y ministros)/i,
      /(?:al menos|cuando menos|mayoría de) seis votos/i,
      /última reforma DOF 14-11-2025/i,
    ],
  },
] as const;

function collectUsedEvidenceIds(value: unknown, key = ""): Set<string> {
  const result = new Set<string>();
  if (
    (key === "evidenceIds" || key.endsWith("EvidenceIds")) &&
    Array.isArray(value)
  ) {
    for (const evidenceId of value) {
      if (typeof evidenceId === "string") result.add(evidenceId);
    }
    return result;
  }
  if (!value || typeof value !== "object") return result;

  for (const [childKey, childValue] of Object.entries(value)) {
    for (const evidenceId of collectUsedEvidenceIds(childValue, childKey)) {
      result.add(evidenceId);
    }
  }
  return result;
}

function expectedSourceOrigin(
  evidenceIds: string[],
  evidenceKinds: Map<string, "official" | "transcript">,
) {
  const kinds = new Set(evidenceIds.map((id) => evidenceKinds.get(id)));
  assert.ok(!kinds.has(undefined));
  if (kinds.size === 2) return "mixed";
  return kinds.has("transcript") ? "class" : "complementary";
}

for (const expected of traceablePackages) {
  test(`${expected.code} conserva ${expected.artifacts} artefactos trazables y un round-trip 1.2 íntegro`, async () => {
    const packagePath = path.join(
      process.cwd(),
      "content",
      "packages",
      expected.fileName,
    );
    const packageFile = classPackageFileSchema.parse(
      JSON.parse(await readFile(packagePath, "utf8")),
    );
    assert.equal(packageFile.packageVersion, "1.2");
    if (packageFile.packageVersion !== "1.2") {
      throw new Error(`${expected.code} debe usar el contrato trazable 1.2.`);
    }
    assert.equal(packageFile.curriculum.code, expected.code);

    const serializedPackage = JSON.stringify(packageFile);
    for (const forbiddenClaim of expected.forbiddenClaims) {
      assert.doesNotMatch(
        serializedPackage,
        forbiddenClaim,
        `${expected.code} reintrodujo una afirmación retirada: ${forbiddenClaim}`,
      );
    }
    for (const requiredClaim of expected.requiredClaims) {
      assert.match(
        serializedPackage,
        requiredClaim,
        `${expected.code} perdió una precisión jurídica requerida: ${requiredClaim}`,
      );
    }

    const cleanedTranscript = packageFile.transcript.cleaned;
    assert.ok(cleanedTranscript);
    const bundle = importableClassPackageSchema.parse({
      ...packageFile,
      transcript: {
        original: cleanedTranscript,
        cleaned: cleanedTranscript,
      },
    });

    if (expected.code === "C06") {
      const questions = bundle.topics.flatMap((topic) => topic.exam.questions);
      for (const question of questions) {
        assert.doesNotMatch(
          question.options[question.correctOption] ?? "",
          /(?:once|11) (?:ministros|integrantes)|(?:ocho|8) votos/i,
          "C06 no puede presentar la integración o votación histórica como respuesta vigente.",
        );
      }

      const obsoleteCompositionQuestion = questions.find((question) =>
        /once ministros/i.test(question.text),
      );
      assert.ok(obsoleteCompositionQuestion);
      assert.match(
        obsoleteCompositionQuestion.options[
          obsoleteCompositionQuestion.correctOption
        ] ?? "",
        /nueve integrantes.*artículo 94 vigente/i,
      );
      assert.match(
        obsoleteCompositionQuestion.explanation,
        /desactualizado.*nueve integrantes/i,
      );
    }

    assert.equal(countClassPackage(bundle).artifacts, expected.artifacts);
    assert.equal(bundle.evidenceRegistry.length, expected.evidence);
    assert.deepEqual(
      [...collectUsedEvidenceIds(bundle)].sort(),
      bundle.evidenceRegistry.map(({ id }) => id).sort(),
    );

    const evidenceKinds = new Map(
      bundle.evidenceRegistry.map(({ id, kind }) => [id, kind]),
    );
    for (const topic of bundle.topics) {
      for (const artifact of [...topic.materials, ...topic.flashcards]) {
        assert.equal(
          artifact.sourceOrigin,
          expectedSourceOrigin(artifact.evidenceIds, evidenceKinds),
        );
      }
    }

    const report = assertClassPackageRoundTrip(bundle, bundle, {
      publicationStatus: "draft",
      topicApprovalStatuses: bundle.topics.map(() => "pending"),
    });
    assert.equal(report.equivalent, true);
  });
}
