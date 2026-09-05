import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const originalMigration = readFileSync(
  "supabase/migrations/20260821203000_persist_traceable_packages.sql",
  "utf8",
);
const lintMigration = readFileSync(
  "supabase/migrations/20260822022138_remove_import_loop_shadowing.sql",
  "utf8",
);
const foreignKeyIndexMigration = readFileSync(
  "supabase/migrations/20260904234059_add_missing_foreign_key_indexes.sql",
  "utf8",
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

function importFunction(sql: string) {
  const match = sql.match(
    /create(?: or replace)? function private\.import_class_package_v12\(p_package jsonb\)[\s\S]*?\$\$;/,
  );
  assert.ok(match, "la migración debe definir private.import_class_package_v12(jsonb)");
  return match[0].replaceAll("\r\n", "\n");
}

test("la migración nueva solo elimina las cuatro declaraciones redundantes", () => {
  let expected = importFunction(originalMigration).replace(
    "create function private.import_class_package_v12",
    "create or replace function private.import_class_package_v12",
  );

  for (const name of ["topic_index", "item_index", "question_index", "option_index"]) {
    expected = expected.replace(`  ${name} integer;\n`, "");
  }

  assert.equal(importFunction(lintMigration), expected);
  assert.match(lintMigration, /returns bigint\s+language plpgsql\s+security invoker\s+set search_path = ''/);
  assert.match(lintMigration, /^  reference_index integer;$/m);
});

test("el lint de base es local y falla ante cualquier warning", () => {
  assert.equal(
    packageJson.scripts["db:lint:local"],
    "supabase db lint --local --level warning --fail-on warning",
  );
  assert.match(packageJson.scripts["test:local"], /npm run test:db-lint-contract/);
  assert.doesNotMatch(packageJson.scripts["db:lint:local"], /--linked|--db-url|project-ref/);
});

test("los cinco foreign keys reportados tienen índices idempotentes y exactos", () => {
  const expected = [
    ["exam_answer_keys_question_correct_option_idx", "exam_answer_keys", "question_id, correct_option_id"],
    ["exam_answers_question_selected_option_idx", "exam_answers", "question_id, selected_option_id"],
    ["practice_session_items_retrieval_item_id_idx", "practice_session_items", "retrieval_item_id"],
    ["retrieval_attempts_retrieval_item_id_idx", "retrieval_attempts", "retrieval_item_id"],
    ["retrieval_schedule_states_retrieval_item_id_idx", "retrieval_schedule_states", "retrieval_item_id"],
  ] as const;

  const definitions = [...foreignKeyIndexMigration.matchAll(
    /create index if not exists ([a-z_]+)\s+on public\.([a-z_]+) \(([^)]+)\);/g,
  )].map((match) => [match[1], match[2], match[3]]);

  assert.deepEqual(definitions, expected);
  assert.doesNotMatch(foreignKeyIndexMigration, /create unique index|drop\s|alter table/i);
});

test("el historial local usa las versiones verificadas en el proyecto remoto", () => {
  const migrations = new Set(readdirSync("supabase/migrations"));
  for (const name of [
    "20260823044401_save_exam_attempt_atomically.sql",
    "20260824044139_add_update_exam_question_v1.sql",
    "20260824224500_add_update_flashcard_and_journey_v1.sql",
    "20260824230108_add_update_material_and_concept_map_v1.sql",
    "20260828195744_adaptive_learning_engine.sql",
    "20260828195753_add_exam_target_date_to_profiles.sql",
    "20260830211835_make_exam_submission_atomic.sql",
    "20260904233622_rate_adaptive_attempt_atomic.sql",
    "20260904234059_add_missing_foreign_key_indexes.sql",
  ]) {
    assert.equal(migrations.has(name), true, `falta la migración remota ${name}`);
  }
  for (const obsoleteName of [
    "20260824040500_add_update_exam_question_v1.sql",
    "20260824224000_add_update_flashcard_and_journey_v1.sql",
    "20260828190238_adaptive_learning_engine.sql",
    "20260828192551_add_exam_target_date_to_profiles.sql",
    "20260830192539_make_exam_submission_atomic.sql",
    "20260904225405_rate_adaptive_attempt_atomic.sql",
    "20260904233842_add_missing_foreign_key_indexes.sql",
  ]) {
    assert.equal(migrations.has(obsoleteName), false, `persiste la versión local ${obsoleteName}`);
  }
});
