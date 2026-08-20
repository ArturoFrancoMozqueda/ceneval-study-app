import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSubjectProgress,
  type PublishedTopic,
} from "../lib/study/subject-progress";

const topics: PublishedTopic[] = [
  { id: 1, subjectId: 10, subjectName: "Derecho civil", title: "Tema 1" },
  { id: 2, subjectId: 10, subjectName: "Derecho civil", title: "Tema 2" },
  { id: 3, subjectId: 20, subjectName: "Derecho penal", title: "Tema 3" },
];

test("deriva cobertura y evidencia real por materia", () => {
  const overview = deriveSubjectProgress(
    topics,
    [
      {
        topicId: 1,
        completedSteps: [
          "discover",
          "understand",
          "apply",
          "remember",
          "check",
        ],
        lastActivityAt: "2026-08-20T12:00:00.000Z",
      },
      {
        topicId: 2,
        completedSteps: ["discover", "understand"],
        lastActivityAt: "2026-08-19T12:00:00.000Z",
      },
    ],
    [
      {
        id: 1,
        topicId: 1,
        needsReview: true,
        answeredAt: "2026-08-18T12:00:00.000Z",
      },
      {
        id: 2,
        topicId: 1,
        needsReview: false,
        answeredAt: "2026-08-20T13:00:00.000Z",
      },
      {
        id: 3,
        topicId: 2,
        needsReview: true,
        answeredAt: "2026-08-19T13:00:00.000Z",
      },
    ],
    [
      {
        id: 1,
        topicId: 1,
        score: 8,
        totalQuestions: 10,
        completedAt: "2026-08-20T14:00:00.000Z",
      },
      {
        id: 2,
        topicId: 2,
        score: 3,
        totalQuestions: 5,
        completedAt: "2026-08-19T14:00:00.000Z",
      },
    ],
  );

  assert.equal(overview.totalTopics, 3);
  assert.equal(overview.startedTopics, 2);
  assert.equal(overview.completedTopics, 1);
  assert.equal(overview.subjects[0].subjectName, "Derecho civil");
  assert.deepEqual(
    {
      total: overview.subjects[0].totalTopics,
      started: overview.subjects[0].startedTopics,
      completed: overview.subjects[0].completedTopics,
      pending: overview.subjects[0].pendingTopics,
      checked: overview.subjects[0].checkedTopics,
      needsReview: overview.subjects[0].needsReviewTopics,
      attempts: overview.subjects[0].completedExamAttempts,
      correct: overview.subjects[0].correctExamAnswers,
      questions: overview.subjects[0].answeredExamQuestions,
      accuracy: overview.subjects[0].examAccuracyPercent,
    },
    {
      total: 2,
      started: 2,
      completed: 1,
      pending: 1,
      checked: 2,
      needsReview: 1,
      attempts: 2,
      correct: 11,
      questions: 15,
      accuracy: 73,
    },
  );
});

test("no inventa desempeño sin intentos válidos ni incluye contenido fuera del catálogo", () => {
  const overview = deriveSubjectProgress(
    topics,
    [
      {
        topicId: 999,
        completedSteps: [
          "discover",
          "understand",
          "apply",
          "remember",
          "check",
        ],
        lastActivityAt: "2026-08-20T12:00:00.000Z",
      },
    ],
    [
      {
        id: 1,
        topicId: 999,
        needsReview: true,
        answeredAt: "2026-08-20T12:00:00.000Z",
      },
    ],
    [
      {
        id: 1,
        topicId: 1,
        score: null,
        totalQuestions: null,
        completedAt: null,
      },
      {
        id: 2,
        topicId: 999,
        score: 10,
        totalQuestions: 10,
        completedAt: "2026-08-20T12:00:00.000Z",
      },
    ],
  );

  assert.equal(overview.startedTopics, 0);
  assert.equal(overview.completedTopics, 0);
  for (const subject of overview.subjects) {
    assert.equal(subject.checkedTopics, 0);
    assert.equal(subject.completedExamAttempts, 0);
    assert.equal(subject.examAccuracyPercent, null);
    assert.equal(subject.lastActivityAt, null);
  }
});

test("desempata comprobaciones simultáneas por el identificador más reciente", () => {
  const overview = deriveSubjectProgress(
    [topics[0]],
    [],
    [
      {
        id: 4,
        topicId: 1,
        needsReview: true,
        answeredAt: "2026-08-20T12:00:00.000Z",
      },
      {
        id: 5,
        topicId: 1,
        needsReview: false,
        answeredAt: "2026-08-20T12:00:00.000Z",
      },
    ],
    [],
  );

  assert.equal(overview.subjects[0].checkedTopics, 1);
  assert.equal(overview.subjects[0].needsReviewTopics, 0);
});
