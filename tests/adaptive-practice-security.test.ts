import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260828195744_adaptive_learning_engine.sql",
  "utf8",
);
const atomicRatingMigration = readFileSync(
  "supabase/migrations/20260904233622_rate_adaptive_attempt_atomic.sql",
  "utf8",
);
const actions = readFileSync("app/actions/adaptive-practice.ts", "utf8");
const types = readFileSync("lib/study/adaptive-practice.ts", "utf8");

test("todas las tablas adaptativas públicas activan RLS", () => {
  for (const table of [
    "retrieval_items",
    "retrieval_item_answer_keys",
    "retrieval_item_evidence",
    "practice_sessions",
    "practice_session_items",
    "retrieval_attempts",
    "retrieval_schedule_states",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("las claves no tienen política ni grant autenticado", () => {
  assert.doesNotMatch(
    migration,
    /create policy[\s\S]*?on public\.retrieval_item_answer_keys/i,
  );
  assert.doesNotMatch(
    migration,
    /grant [^;]+ on public\.retrieval_item_answer_keys to authenticated/i,
  );
  assert.match(
    migration,
    /grant select, insert, update, delete on public\.retrieval_items,[\s\S]*public\.retrieval_item_answer_keys,[\s\S]*to service_role/,
  );
});

test("la importación exige aprobación y queda reservada al service role", () => {
  assert.match(migration, /p_corpus ->> 'approvalStatus' <> 'approved'/);
  assert.match(migration, /'draft'\s*\n\s*\) returning id/);
  assert.match(
    migration,
    /revoke all on function public\.import_retrieval_corpus_v1\(jsonb\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.import_retrieval_corpus_v1\(jsonb\)[\s\S]*to service_role/,
  );
});

test("la clave se lee solo en la acción servidor después de autorizar el ítem", () => {
  assert.match(actions, /^"use server";/);
  assert.match(actions, /createServerSupabaseClient/);
  assert.match(actions, /retrieval_item_answer_keys/);
  assert.match(actions, /getSupabaseAdminClient/);
  const publicItem = types.match(/type PracticeItem = \{[^}]+\}/)?.[0] ?? "";
  assert.ok(publicItem);
  assert.doesNotMatch(publicItem, /requiredPoints|answerKey/);
});

test("sesiones reanudables e intento idempotente quedan fijados en esquema", () => {
  assert.match(migration, /create table public\.practice_sessions/);
  assert.match(migration, /unique \(session_id, session_position\)/);
  assert.match(migration, /enqueue_retrieval_retry_v1/);
  assert.match(actions, /abandonPracticeSessionAction/);
});

test("la sesión puede iniciar una cola global o restringida a un tema", () => {
  assert.match(actions, /topicId: z\.number\(\)\.int\(\)\.positive\(\)\.optional\(\)/);
  assert.match(actions, /if \(parsed\.data\.topicId !== undefined\)/);
  assert.match(actions, /prioritizeDueRetrievalItems/);
});

test("la calificación adaptativa usa una única RPC transaccional", () => {
  const rateAction = actions.slice(
    actions.indexOf("export async function rateAdaptiveAttemptAction"),
    actions.indexOf("export async function abandonPracticeSessionAction"),
  );
  assert.match(rateAction, /admin\.rpc\(\s*"rate_adaptive_attempt_v1"/);
  assert.doesNotMatch(rateAction, /\.from\("retrieval_attempts"\)\s*\.update/);
  assert.doesNotMatch(rateAction, /\.from\("retrieval_schedule_states"\)\.upsert/);
  assert.doesNotMatch(rateAction, /enqueue_retrieval_retry_v1/);
  assert.match(rateAction, /atomicRateResultSchema\.safeParse/);
});

test("la calificación adaptativa falla cerrada si la RPC no está disponible", () => {
  const rateAction = actions.slice(
    actions.indexOf("export async function rateAdaptiveAttemptAction"),
    actions.indexOf("export async function abandonPracticeSessionAction"),
  );
  assert.match(rateAction, /return unavailable\("rateAdaptiveAttemptAtomic", atomicError\)/);
  assert.doesNotMatch(rateAction, /PGRST202|rateAdaptiveAttemptLegacy/);
  assert.doesNotMatch(actions, /async function rateAdaptiveAttemptLegacy/);
});

test("la RPC fija propiedad y estado bajo bloqueo antes de mutar", () => {
  assert.match(atomicRatingMigration, /^begin;/);
  assert.match(atomicRatingMigration, /create function public\.rate_adaptive_attempt_v1/);
  assert.match(atomicRatingMigration, /security invoker\s+set search_path = ''/);
  assert.match(
    atomicRatingMigration,
    /attempt\.id = p_attempt_id\s+and attempt\.user_id = p_user_id\s+for update/,
  );
  assert.match(atomicRatingMigration, /session\.status = 'active'/);
  assert.match(
    atomicRatingMigration,
    /session\.current_position = locked_attempt\.session_position/,
  );
  assert.match(atomicRatingMigration, /session_item\.status = 'revealed'/);
  assert.match(atomicRatingMigration, /for update of session, session_item/);
  assert.match(atomicRatingMigration, /update public\.retrieval_attempts/);
  assert.match(atomicRatingMigration, /insert into public\.retrieval_schedule_states/);
  assert.match(atomicRatingMigration, /update public\.practice_session_items/);
  assert.match(atomicRatingMigration, /perform public\.enqueue_retrieval_retry_v1/);
  assert.match(atomicRatingMigration, /update public\.practice_sessions/);
  assert.match(atomicRatingMigration, /commit;\s*$/);
});

test("la RPC adaptativa solo concede EXECUTE al service role", () => {
  const signature = String.raw`public\.rate_adaptive_attempt_v1\([\s\S]*?\)`;
  assert.match(
    atomicRatingMigration,
    new RegExp(`revoke all on function ${signature} from public, anon, authenticated;`),
  );
  assert.match(
    atomicRatingMigration,
    new RegExp(`grant execute on function ${signature} to service_role;`),
  );
});
