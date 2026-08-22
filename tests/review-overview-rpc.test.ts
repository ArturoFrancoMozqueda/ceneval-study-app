import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260822045918_add_review_overview_v1.sql",
    import.meta.url,
  ),
  "utf8",
);
const runner = readFileSync(
  new URL("../scripts/test-review-overview-local.ts", import.meta.url),
  "utf8",
);

test("RPC overview es invoker, sin uid parametrizable y authenticated-only", () => {
  assert.match(migration, /function public\.get_review_overview_v1\(\)/);
  assert.match(migration, /returns table \(overview jsonb\)/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /review\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /response\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(
    migration,
    /revoke all on function public\.get_review_overview_v1\(\)[\s\S]*from public, anon, authenticated, service_role/,
  );
  assert.match(
    migration,
    /grant execute on function public\.get_review_overview_v1\(\)[\s\S]*to authenticated/,
  );
  assert.doesNotMatch(migration, /security definer|p_user|user_id uuid/);
});

test("RPC conserva forma camelCase, visibilidad y desempate determinista", () => {
  for (const key of [
    "dueCards",
    "currentDifficultCards",
    "currentDifficultChecks",
    "currentDifficultCount",
    "nextReviewAt",
    "topicId",
    "topicTitle",
    "classId",
    "classTitle",
    "curriculumCode",
  ]) {
    assert.match(migration, new RegExp(`'${key}'`));
  }
  assert.match(migration, /topic\.approval_status = 'approved'/);
  assert.match(migration, /class_row\.publication_status = 'published'/);
  assert.match(migration, /reviewed_at desc,[\s\S]*review\.id desc/);
  assert.match(migration, /answered_at desc,[\s\S]*response\.id desc/);
  assert.match(
    migration,
    /case review\.rating[\s\S]*when 'again' then 0[\s\S]*when 'hard' then 1[\s\S]*when 'good' then 2[\s\S]*when 'easy' then 3/,
  );
  assert.match(
    migration,
    /coalesce\(review\.next_review_at, '-infinity'::timestamptz\),[\s\S]*review\.flashcard_id/,
  );
  assert.match(
    migration,
    /review\.next_review_at <= statement_timestamp\(\)/,
  );
  assert.match(
    migration,
    /min\(next_review_at\) filter \([\s\S]*next_review_at > statement_timestamp\(\)/,
  );
  assert.doesNotMatch(migration, /limit 500/);
});

test("índices sustituidos cubren latest y runner prueba escala, ACL y cleanup", () => {
  assert.match(
    migration,
    /\(user_id, flashcard_id, reviewed_at desc, id desc\)[\s\S]*include \(rating, next_review_at\)/,
  );
  assert.match(
    migration,
    /\(user_id, topic_id, answered_at desc, id desc\)[\s\S]*include \(needs_review\)/,
  );
  assert.match(runner, /length: 501/);
  assert.match(runner, /E2E_OTHER_STUDENT_EMAIL/);
  assert.match(runner, /\["pending", "rejected"\]/);
  assert.match(runner, /\["draft", "withdrawn"\]/);
  assert.match(runner, /error\?\.code, "42501"/);
  assert.match(runner, /data\.length, 1/);
  assert.match(runner, /cleanup propio review overview = 0/);
  assert.match(runner, /validateLocalSupabaseStatus/);
});
