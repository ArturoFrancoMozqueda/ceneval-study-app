import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const action = readFileSync("app/actions/academic.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260830211835_make_exam_submission_atomic.sql",
  "utf8",
);
const historicalMigration = readFileSync(
  "supabase/migrations/20260823044401_save_exam_attempt_atomically.sql",
  "utf8",
);

test("la entrega de examen usa una sola RPC autenticada", () => {
  const start = action.indexOf("export async function submitExamAction");
  assert.notEqual(start, -1);
  const body = action.slice(start);

  assert.match(body, /await requireUser\(\)/);
  assert.match(body, /\.rpc\("submit_exam_v1"/);
  assert.doesNotMatch(body, /PGRST202|submitExamLegacy/);
  assert.match(body, /return databaseError\("submitExam", error\)/);
  assert.doesNotMatch(body, /\.from\("exam_attempts"\)/);
  assert.doesNotMatch(body, /\.from\("exam_answers"\)/);
  assert.doesNotMatch(body, /\.from\("exam_answer_keys"\)/);
});

test("la RPC califica y persiste dentro de una transacción sin abrir las claves", () => {
  assert.match(
    migration,
    /create or replace function public\.submit_exam_v1\([\s\S]*security definer[\s\S]*set search_path = ''/,
  );
  assert.match(migration, /v_user_id uuid := \(select auth\.uid\(\)\)/);
  assert.match(migration, /insert into public\.exam_attempts/);
  assert.match(migration, /insert into public\.exam_answers/);
  assert.match(
    migration,
    /revoke all on function public\.submit_exam_v1\(bigint, jsonb\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.submit_exam_v1\(bigint, jsonb\)[\s\S]*to authenticated/,
  );
  assert.doesNotMatch(migration, /grant[^;]*exam_answer_keys[^;]*authenticated/i);
});

test("la base replica límites de actividad y pertenencia de opciones", () => {
  assert.match(migration, /study_progress_material_index_bounded/);
  assert.match(migration, /study_progress_completed_steps_bounded/);
  assert.match(migration, /quick_check_prompt_length_valid/);
  assert.match(migration, /quick_check_response_length_valid/);
  assert.match(migration, /exam_answer_keys_option_belongs_to_question/);
  assert.match(migration, /exam_answers_option_belongs_to_question/);
});

test("el historial conserva la primera RPC atómica e idempotente verificada", () => {
  assert.match(historicalMigration, /create or replace function public\.save_exam_attempt_v1/);
  assert.match(historicalMigration, /unique index exam_attempts_user_submission_idx/);
  assert.match(historicalMigration, /when unique_violation[\s\S]*submission_fingerprint/);
  assert.match(
    historicalMigration,
    /revoke all on function public\.save_exam_attempt_v1[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    historicalMigration,
    /grant execute on function public\.save_exam_attempt_v1[\s\S]*to service_role/,
  );
});
