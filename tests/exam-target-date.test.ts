import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyExamTargetHeuristicV1,
  EXAM_TARGET_HEURISTIC_VERSION,
  validateFutureExamTargetDate,
} from "../lib/study/exam-target";
import type { RetrievalScheduleState } from "../lib/study/adaptive-practice";

const baseline: RetrievalScheduleState = {
  stage: 5,
  successStreak: 4,
  lapseCount: 0,
  lastConfidence: "sure",
  lastOutcome: "correct",
  lastReviewedAt: "2026-08-28T12:00:00.000Z",
  nextReviewAt: "2026-10-27T12:00:00.000Z",
  schedulerVersion: "spacing-v1",
};

test("acepta solo una fecha calendario posterior a hoy", () => {
  const today = new Date("2026-08-28T12:00:00.000Z");
  assert.equal(validateFutureExamTargetDate("2026-08-29", today), "2026-08-29");
  assert.equal(validateFutureExamTargetDate("2026-08-28", today), null);
  assert.equal(validateFutureExamTargetDate("2026-02-30", today), null);
  assert.equal(validateFutureExamTargetDate("28/08/2026", today), null);
});

test("la heurística versionada solo acorta el siguiente intervalo", () => {
  const reviewedAt = new Date("2026-08-28T12:00:00.000Z");
  const adjusted = applyExamTargetHeuristicV1(
    baseline,
    "2026-09-03",
    reviewedAt,
  );
  assert.equal(EXAM_TARGET_HEURISTIC_VERSION, "spacing-v1-exam-date-v1");
  assert.equal(adjusted.nextReviewAt, "2026-08-31T12:00:00.000Z");
  assert.equal(adjusted.schedulerVersion, "spacing-v1");
  assert.deepEqual(applyExamTargetHeuristicV1(baseline, null, reviewedAt), baseline);
});

test("persistencia y acción conservan propiedad y versión cerrada", () => {
  const migration = readFileSync(
    "supabase/migrations/20260828192551_add_exam_target_date_to_profiles.sql",
    "utf8",
  );
  const action = readFileSync("app/actions/account.ts", "utf8");
  const page = readFileSync("app/cuenta/page.tsx", "utf8");
  assert.match(migration, /exam_target_date date/);
  assert.match(migration, /spacing-v1-exam-date-v1/);
  assert.match(migration, /revoke update on public\.profiles from authenticated/);
  assert.match(migration, /grant update \(full_name, exam_target_date, exam_target_heuristic_version\)/);
  assert.doesNotMatch(migration, /grant update \([^)]*role/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = id\)/);
  assert.match(action, /requireUser\(\)/);
  assert.match(action, /\.eq\("id", user\.id\)/);
  assert.match(page, /Quitar fecha/);
  assert.match(page, /no una recomendación científicamente validada/i);
});
