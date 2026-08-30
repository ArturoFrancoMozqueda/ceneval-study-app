import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const suite = readFileSync(
  new URL("../scripts/test-rls.ts", import.meta.url),
  "utf8",
);
const fixture = readFileSync(
  new URL("../scripts/with-local-e2e-fixture.ts", import.meta.url),
  "utf8",
);
const evidencePolicy = readFileSync(
  new URL(
    "../supabase/migrations/20260821203200_break_evidence_rls_recursion.sql",
    import.meta.url,
  ),
  "utf8",
);

test("la suite RLS falla cerrada mediante el validador local compartido", () => {
  assert.match(suite, /validateLocalSupabaseStatus/);
  assert.match(suite, /SUPABASE_LOCAL_DB_URL/);
  assert.match(suite, /E2E_CLASS_ID/);
  assert.match(suite, /E2E_TOPIC_ID/);
  assert.doesNotMatch(suite, /createSyntheticTraceablePackage/);
});

test("cubre recursos editoriales nuevos, claves y RPC privadas", () => {
  for (const token of [
    "class_evidence",
    "topic_learning_journeys",
    "editorial_artifacts",
    "editorial_artifact_evidence",
    "exam_answer_keys",
    "import_class_package_v12",
    "export_class_package_v12",
    "submit_exam_v1",
  ]) {
    assert.match(suite, new RegExp(token));
  }
  assert.match(suite, /error\?\.code === "42501"/);
});

test("cubre owner/other y estados pending/rejected con diagnóstico seguro", () => {
  assert.match(fixture, /E2E_OTHER_STUDENT_EMAIL/);
  assert.match(suite, /progreso aislado por propietaria/);
  assert.match(suite, /quick checks aislados/);
  assert.match(suite, /revisiones aisladas/);
  assert.match(suite, /\["pending", "rejected"\]/);
  assert.match(suite, /return "Error desconocido"/);
  assert.match(suite, /\^\[A-Z0-9\]\{1,10\}\$/);
  assert.match(suite, /checkpoint=\$\{lastCheckpoint\}/);
  assert.match(suite, /replace\(\/https\?:/);
  assert.match(suite, /progreso bloqueado en/);
  assert.match(suite, /quick check bloqueado en/);
  assert.match(suite, /revisión bloqueada en/);
  assert.match(suite, /entrega atómica de examen/);
  assert.match(suite, /entrega inválida no deja intento parcial/);
  assert.match(suite, /examen bloqueado en/);
});

test("rompe la recursión con un helper privado mínimo y cerrado", () => {
  assert.match(evidencePolicy, /security definer/);
  assert.match(evidencePolicy, /stable/);
  assert.match(evidencePolicy, /set search_path = ''/);
  assert.match(evidencePolicy, /\(select auth\.uid\(\)\) is not null/);
  assert.match(evidencePolicy, /evidence\.class_id = artifact\.class_id/);
  assert.match(evidencePolicy, /topic\.class_id = artifact\.class_id/);
  assert.match(evidencePolicy, /topic\.approval_status = 'approved'/);
  assert.match(evidencePolicy, /class_row\.publication_status = 'published'/);
  assert.match(evidencePolicy, /revoke all[\s\S]*from public, anon, authenticated/);
  assert.match(evidencePolicy, /grant execute[\s\S]*to authenticated/);
});
