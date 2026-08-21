import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260821203000_persist_traceable_packages.sql",
    import.meta.url,
  ),
  "utf8",
);

test("la migración es atómica y conserva las migraciones anteriores", () => {
  assert.match(migration, /^begin;[\s\S]*commit;\s*$/);
  assert.doesNotMatch(migration, /drop table|truncate table/i);
});

test("el RPC público de importación es invoker y exclusivo de service_role", () => {
  assert.match(
    migration,
    /create function public\.import_class_package_v12\(p_package jsonb\)[\s\S]*security invoker[\s\S]*set search_path = ''/,
  );
  assert.match(
    migration,
    /revoke all on function public\.import_class_package_v12\(jsonb\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.import_class_package_v12\(jsonb\)[\s\S]*to service_role/,
  );
  assert.doesNotMatch(migration, /security definer/i);
});

test("el RPC fuerza borrador y temas pendientes y rechaza contratos o duplicados", () => {
  assert.match(migration, /p_package ->> 'packageVersion' <> '1\.2'/);
  assert.match(migration, /'draft', v_curriculum_code, v_curriculum_order/);
  assert.match(migration, /'generated', 'pending'/);
  assert.match(migration, /count\(\*\) <> count\(distinct entry ->> 'id'\)/);
  assert.match(
    migration,
    /class_row\.curriculum_code = v_curriculum_code[\s\S]*class_row\.curriculum_order = v_curriculum_order/,
  );
  assert.doesNotMatch(
    migration,
    /where\s+curriculum_code\s*=\s*curriculum_code/i,
  );
});

test("evidencia y journeys tienen RLS, privilegios explícitos y no cruzan clases", () => {
  for (const table of [
    "class_evidence",
    "topic_learning_journeys",
    "editorial_artifacts",
    "editorial_artifact_evidence",
  ]) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`),
    );
  }
  assert.match(migration, /artifact\.class_id = class_evidence\.class_id/);
  assert.match(migration, /topic\.class_id = artifact\.class_id/);
  assert.match(migration, /evidence\.class_id = artifact\.class_id/);
});

test("cada artefacto exige evidencia existente y ninguna evidencia queda sin uso", () => {
  assert.match(migration, /Cada artefacto requiere al menos una evidencia/);
  assert.match(migration, /Un artefacto referencia evidencia inexistente/);
  assert.match(
    migration,
    /El registro contiene evidencia que ningún artefacto utiliza/,
  );
  assert.match(migration, /if not private\.class_has_complete_evidence\(v_class_id\)/);
});

test("cambiar evidencia invalida el dictamen y el gate exige trazabilidad completa", () => {
  for (const trigger of [
    "class_evidence_invalidate_review",
    "topic_learning_journeys_invalidate_review",
    "editorial_artifacts_invalidate_review",
    "editorial_artifact_evidence_invalidate_review",
  ]) {
    assert.match(migration, new RegExp(`create trigger ${trigger}`));
  }
  assert.match(
    migration,
    /perform private\.touch_class_editorial_content\([\s\S]*Cambió la evidencia trazable/,
  );
  assert.match(
    migration,
    /if not private\.class_has_complete_evidence\(new\.id\) then/,
  );
});

test("el export reconstruye relaciones y es exclusivo de service_role", () => {
  assert.match(
    migration,
    /create function public\.export_class_package_v12\(p_class_id bigint\)[\s\S]*security invoker/,
  );
  assert.match(
    migration,
    /revoke all on function public\.export_class_package_v12\(bigint\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.export_class_package_v12\(bigint\)[\s\S]*to service_role/,
  );
  assert.match(migration, /from public\.class_evidence evidence/);
  assert.match(migration, /join public\.exam_answer_keys answer_key/);
  assert.doesNotMatch(migration, /package_payload|original_payload|source_payload/);
});

test("el orden de referencias y vínculos se persiste explícitamente", () => {
  assert.match(migration, /add column position integer/);
  assert.match(migration, /unique \(topic_id, position\)/);
  assert.match(migration, /unique \(artifact_id, position\)/);
  assert.match(migration, /order by link\.position/);
});
