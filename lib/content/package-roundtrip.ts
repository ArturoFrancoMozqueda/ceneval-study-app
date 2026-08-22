import { isDeepStrictEqual } from "node:util";
import {
  persistableClassPackageSchema,
  type PersistableClassPackage,
} from "./package-schema";
import { toPersistableClassPackage } from "./package-persistence";

export type PackageRoundTripCounts = {
  topics: number;
  learningJourneys: number;
  materials: number;
  conceptMapNodes: number;
  references: number;
  flashcards: number;
  examQuestions: number;
  examOptions: number;
  artifacts: number;
  evidenceEntries: number;
  evidenceLinks: number;
};

export type PersistedPackageState = {
  publicationStatus: string;
  topicApprovalStatuses: string[];
};

export type PackageRoundTripReport = {
  equivalent: boolean;
  differences: string[];
  expectedCounts: PackageRoundTripCounts;
  actualCounts: PackageRoundTripCounts;
};

function evidenceLinkCount(bundle: PersistableClassPackage): number {
  return bundle.topics.reduce((total, topic) => {
    const journey = topic.learningJourney;
    const journeyLinks =
      journey.openingPromptEvidenceIds.length +
      journey.quickChecks.reduce(
        (sum, check) => sum + check.evidenceIds.length,
        0,
      ) +
      journey.practicalCase.evidenceIds.length +
      journey.closingPromptEvidenceIds.length +
      journey.nextActivityEvidenceIds.length;
    const questionLinks = topic.exam.questions.reduce(
      (sum, question) =>
        sum +
        question.evidenceIds.length +
        question.optionEvidenceIds.reduce(
          (optionSum, ids) => optionSum + ids.length,
          0,
        ) +
        question.correctOptionEvidenceIds.length +
        question.explanationEvidenceIds.length +
        question.optionExplanationEvidenceIds.reduce(
          (optionSum, ids) => optionSum + ids.length,
          0,
        ),
      0,
    );

    return (
      total +
      journeyLinks +
      topic.materials.reduce(
        (sum, material) => sum + material.evidenceIds.length,
        0,
      ) +
      topic.conceptMap.nodes.reduce(
        (sum, node) => sum + node.evidenceIds.length,
        0,
      ) +
      topic.flashcards.reduce(
        (sum, card) => sum + card.evidenceIds.length,
        0,
      ) +
      questionLinks
    );
  }, 0);
}

export function countClassPackage(
  input: unknown,
): PackageRoundTripCounts {
  const persisted = persistableClassPackageSchema.safeParse(input);
  const bundle = persisted.success
    ? persisted.data
    : toPersistableClassPackage(input);
  const examQuestions = bundle.topics.reduce(
    (sum, topic) => sum + topic.exam.questions.length,
    0,
  );
  const examOptions = bundle.topics.reduce(
    (sum, topic) =>
      sum +
      topic.exam.questions.reduce(
        (questionSum, question) => questionSum + question.options.length,
        0,
      ),
    0,
  );
  return {
    topics: bundle.topics.length,
    learningJourneys: bundle.topics.length,
    materials: bundle.topics.reduce(
      (sum, topic) => sum + topic.materials.length,
      0,
    ),
    conceptMapNodes: bundle.topics.reduce(
      (sum, topic) => sum + topic.conceptMap.nodes.length,
      0,
    ),
    references: bundle.topics.reduce(
      (sum, topic) => sum + topic.references.length,
      0,
    ),
    flashcards: bundle.topics.reduce(
      (sum, topic) => sum + topic.flashcards.length,
      0,
    ),
    examQuestions,
    examOptions,
    artifacts:
      bundle.topics.reduce(
        (sum, topic) =>
          sum +
          4 +
          topic.learningJourney.quickChecks.length +
          topic.materials.length +
          topic.conceptMap.nodes.length +
          topic.flashcards.length,
        0,
      ) +
      examQuestions * 3 +
      examOptions * 2,
    evidenceEntries: bundle.evidenceRegistry.length,
    evidenceLinks: evidenceLinkCount(bundle),
  };
}

function canonicalizePersisted(input: unknown): PersistableClassPackage {
  const bundle = persistableClassPackageSchema.parse(input);
  return {
    ...bundle,
    // SQL reconstruye el registro por su clave estable. Ninguna otra colección
    // puede reordenarse: sus posiciones tienen significado editorial.
    evidenceRegistry: [...bundle.evidenceRegistry].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  };
}

function collectDifferencePaths(
  expected: unknown,
  actual: unknown,
  path: string,
  differences: string[],
) {
  if (differences.length >= 50 || isDeepStrictEqual(expected, actual)) return;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) differences.push(`${path}.length`);
    const commonLength = Math.min(expected.length, actual.length);
    for (let index = 0; index < commonLength; index += 1) {
      collectDifferencePaths(
        expected[index],
        actual[index],
        `${path}.${index}`,
        differences,
      );
    }
    return;
  }
  if (
    expected &&
    actual &&
    typeof expected === "object" &&
    typeof actual === "object"
  ) {
    const keys = new Set([
      ...Object.keys(expected as Record<string, unknown>),
      ...Object.keys(actual as Record<string, unknown>),
    ]);
    for (const key of [...keys].sort()) {
      collectDifferencePaths(
        (expected as Record<string, unknown>)[key],
        (actual as Record<string, unknown>)[key],
        `${path}.${key}`,
        differences,
      );
    }
    return;
  }
  differences.push(path);
}

export function compareClassPackageRoundTrip(
  expectedInput: unknown,
  actualInput: unknown,
  persistedState?: PersistedPackageState,
): PackageRoundTripReport {
  const expected = canonicalizePersisted(
    toPersistableClassPackage(expectedInput),
  );
  const actual = canonicalizePersisted(actualInput);
  const differences: string[] = [];
  collectDifferencePaths(expected, actual, "package", differences);

  if (persistedState) {
    if (persistedState.publicationStatus !== "draft") {
      differences.push("state.publicationStatus");
    }
    if (
      persistedState.topicApprovalStatuses.length !== expected.topics.length
    ) {
      differences.push("state.topicApprovalStatuses.length");
    }
    persistedState.topicApprovalStatuses.forEach((status, index) => {
      if (status !== "pending") {
        differences.push(`state.topicApprovalStatuses.${index}`);
      }
    });
  }

  const expectedCounts = countClassPackage(expected);
  const actualCounts = countClassPackage(actual);
  if (!isDeepStrictEqual(expectedCounts, actualCounts)) {
    differences.push("counts");
  }

  return {
    equivalent: differences.length === 0,
    differences: [...new Set(differences)],
    expectedCounts,
    actualCounts,
  };
}

export function assertClassPackageRoundTrip(
  expectedInput: unknown,
  actualInput: unknown,
  persistedState?: PersistedPackageState,
): PackageRoundTripReport {
  const report = compareClassPackageRoundTrip(
    expectedInput,
    actualInput,
    persistedState,
  );
  if (!report.equivalent) {
    throw new Error(
      `El round-trip 1.2 perdió semántica en: ${report.differences.join(", ")}.`,
    );
  }
  return report;
}
