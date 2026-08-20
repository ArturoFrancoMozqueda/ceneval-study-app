import assert from "node:assert/strict";
import {
  getLatestQuickChecks,
  summarizeFlashcardReviews,
  type FlashcardReviewRecord,
} from "../lib/study/review-schedule";

const now = new Date("2026-08-20T18:00:00.000Z");
const reviews: FlashcardReviewRecord[] = [
  {
    id: 1,
    flashcardId: 10,
    rating: "hard",
    reviewedAt: "2026-08-18T18:00:00.000Z",
    nextReviewAt: "2026-08-19T18:00:00.000Z",
  },
  {
    id: 2,
    flashcardId: 10,
    rating: "easy",
    reviewedAt: "2026-08-20T17:00:00.000Z",
    nextReviewAt: "2026-08-27T17:00:00.000Z",
  },
  {
    id: 3,
    flashcardId: 20,
    rating: "good",
    reviewedAt: "2026-08-16T18:00:00.000Z",
    nextReviewAt: "2026-08-19T18:00:00.000Z",
  },
  {
    id: 4,
    flashcardId: 30,
    rating: "again",
    reviewedAt: "2026-08-20T17:30:00.000Z",
    nextReviewAt: "2026-08-20T17:40:00.000Z",
  },
];

const summary = summarizeFlashcardReviews(reviews, now);

assert.equal(summary.latest.length, 3);
assert.equal(summary.currentDifficultCount, 1);
assert.deepEqual(
  summary.due.map((review) => review.flashcardId),
  [30, 20],
);
assert.equal(summary.nextReviewAt, "2026-08-27T17:00:00.000Z");

const latestChecks = getLatestQuickChecks([
  {
    id: 1,
    topicId: 7,
    needsReview: true,
    answeredAt: "2026-08-19T12:00:00.000Z",
  },
  {
    id: 2,
    topicId: 7,
    needsReview: false,
    answeredAt: "2026-08-20T12:00:00.000Z",
  },
  {
    id: 3,
    topicId: 8,
    needsReview: true,
    answeredAt: "2026-08-20T11:00:00.000Z",
  },
]);

assert.equal(latestChecks.length, 2);
assert.equal(latestChecks.filter((check) => check.needsReview).length, 1);

console.log("Review schedule tests passed.");
