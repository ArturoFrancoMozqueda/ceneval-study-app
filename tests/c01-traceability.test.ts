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

const c01Path = path.join(
  process.cwd(),
  "content",
  "packages",
  "audio-01-02-orientacion-egel-derecho.json",
);

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

test("C01 conserva 139 artefactos trazables y un round-trip 1.2 íntegro", async () => {
  const packageFile = classPackageFileSchema.parse(
    JSON.parse(await readFile(c01Path, "utf8")),
  );
  assert.equal(packageFile.packageVersion, "1.2");
  if (packageFile.packageVersion !== "1.2") {
    throw new Error("C01 debe usar el contrato trazable 1.2.");
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

  assert.equal(countClassPackage(bundle).artifacts, 139);
  assert.deepEqual(
    [...collectUsedEvidenceIds(bundle)].sort(),
    bundle.evidenceRegistry.map(({ id }) => id).sort(),
  );

  const report = assertClassPackageRoundTrip(bundle, bundle, {
    publicationStatus: "draft",
    topicApprovalStatuses: bundle.topics.map(() => "pending"),
  });
  assert.equal(report.equivalent, true);
});
