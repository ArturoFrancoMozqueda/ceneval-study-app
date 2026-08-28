import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260828190238_adaptive_learning_engine.sql",
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
