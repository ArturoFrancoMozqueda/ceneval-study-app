import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const e2e = readFileSync(
  new URL("../scripts/test-study-e2e.py", import.meta.url),
  "utf8",
);

test("el E2E recorre el panel y el detalle editorial publicados", () => {
  assert.match(e2e, /name="Panel editorial"\)\.first\.click\(\)/);
  assert.match(e2e, /wait_for_url\(f"\{base_url\}\/administrar"\)/);
  assert.match(e2e, /filter\(has_text="Publicadas"\)/);
  assert.match(e2e, /to_have_text\("1"\)/);
  assert.match(e2e, /editorial_class_path = f"\/administrar\/clases\/\{class_id\}"/);
  assert.match(e2e, /name="Clase sintética de persistencia"/);
  assert.match(e2e, /Estado actual: Publicada/);
  assert.match(e2e, /name="Publicación"/);
});

test("el recorrido administrativo es read-only y conserva el gate de errores", () => {
  assert.match(
    e2e,
    /get_by_role\("button", name="Publicar clase", exact=True\)[\s\S]*to_be_disabled\(\)/,
  );
  assert.doesNotMatch(e2e, /name="Sí, publicar clase"[\s\S]*\.click\(\)/);
  assert.doesNotMatch(e2e, /name="Retirar"[\s\S]*\.click\(\)/);

  const adminFlow = e2e.indexOf('name="Panel editorial"');
  const errorGate = e2e.indexOf("if console_errors or page_errors:");
  assert.ok(adminFlow >= 0 && errorGate > adminFlow);
});

test("el E2E verifica health antes del login y redacta readiness", () => {
  for (const required of [
    '"/api/health/live"',
    '"/api/health/ready"',
    '{"status": "live"}',
    '{"status": "not_found"}',
    '{"status": "ready"}',
    'required_env("OPS_READINESS_TOKEN")',
    "assert_no_store",
  ]) {
    assert.ok(e2e.includes(required), `Falta contrato health: ${required}`);
  }
  assert.ok(
    e2e.indexOf('base_url, "/api/health/live"') <
      e2e.indexOf('page.goto(f"{base_url}/iniciar-sesion"'),
  );
  assert.match(e2e, /secrets = \[[\s\S]*readiness_token/);
});
