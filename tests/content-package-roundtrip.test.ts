import assert from "node:assert/strict";
import test from "node:test";
import {
  assertClassPackageRoundTrip,
  compareClassPackageRoundTrip,
  countClassPackage,
} from "../lib/content/package-roundtrip";
import { createSyntheticTraceablePackage } from "./fixtures/traceable-package";

function cloneFixture() {
  return structuredClone(createSyntheticTraceablePackage());
}

test("acepta únicamente el reordenamiento canónico del registro de evidencia", () => {
  const expected = cloneFixture();
  const exported = cloneFixture();
  exported.evidenceRegistry.reverse();

  const report = assertClassPackageRoundTrip(expected, exported, {
    publicationStatus: "draft",
    topicApprovalStatuses: ["pending"],
  });

  assert.equal(report.equivalent, true);
  assert.deepEqual(report.differences, []);
});

test("rechaza reordenar cualquier colección con posición editorial", () => {
  const expected = cloneFixture();
  const exported = cloneFixture();
  exported.topics[0]!.materials.reverse();

  const report = compareClassPackageRoundTrip(expected, exported);
  assert.equal(report.equivalent, false);
  assert.ok(
    report.differences.some((path) =>
      path.startsWith("package.topics.0.materials.0"),
    ),
  );
});

test("detecta pérdida de un vínculo aunque el paquete exportado siga siendo válido", () => {
  const expected = cloneFixture();
  const exported = cloneFixture();
  exported.topics[0]!.materials[0]!.evidenceIds = [
    "ev-transcript-synthetic",
  ];

  const report = compareClassPackageRoundTrip(expected, exported);
  assert.equal(report.equivalent, false);
  assert.ok(
    report.differences.includes(
      "package.topics.0.materials.0.evidenceIds.length",
    ),
  );
  assert.equal(
    report.actualCounts.evidenceLinks,
    report.expectedCounts.evidenceLinks - 1,
  );
  assert.ok(report.differences.includes("counts"));
});

test("cuenta todos los artefactos y vínculos del fixture sintético", () => {
  assert.deepEqual(countClassPackage(cloneFixture()), {
    topics: 1,
    learningJourneys: 1,
    materials: 9,
    conceptMapNodes: 3,
    references: 1,
    flashcards: 10,
    examQuestions: 10,
    examOptions: 30,
    artifacts: 118,
    evidenceEntries: 2,
    evidenceLinks: 236,
  });
});

test("exige que la importación permanezca en borrador y los temas pendientes", () => {
  const fixture = cloneFixture();
  const report = compareClassPackageRoundTrip(fixture, fixture, {
    publicationStatus: "published",
    topicApprovalStatuses: ["approved"],
  });

  assert.equal(report.equivalent, false);
  assert.ok(report.differences.includes("state.publicationStatus"));
  assert.ok(report.differences.includes("state.topicApprovalStatuses.0"));
  assert.throws(
    () =>
      assertClassPackageRoundTrip(fixture, fixture, {
        publicationStatus: "published",
        topicApprovalStatuses: ["approved"],
      }),
    /state\.publicationStatus.*state\.topicApprovalStatuses\.0/,
  );
});
