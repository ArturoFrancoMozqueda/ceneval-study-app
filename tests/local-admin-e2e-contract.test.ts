import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const e2e = readFileSync(
  new URL("../scripts/test-study-e2e.py", import.meta.url),
  "utf8",
);

test("el E2E recorre el panel y el detalle editorial publicados", () => {
  assert.match(e2e, /admin_link = page\.get_by_role\("link", name="Panel editorial"\)/);
  assert.match(e2e, /to_have_attribute\("href", "\/administrar"\)/);
  assert.match(e2e, /page\.goto\(f"\{base_url\}\/administrar"/);
  assert.match(e2e, /filter\(has_text="Publicadas"\)/);
  assert.match(e2e, /to_have_text\("1"\)/);
  assert.match(e2e, /editorial_class_path = f"\/administrar\/clases\/\{class_id\}"/);
  assert.match(e2e, /to_contain_text\("Clase sintética de persistencia"\)/);
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
  const errorGate = e2e.indexOf("if console_errors or page_errors or network_errors:");
  assert.ok(adminFlow >= 0 && errorGate > adminFlow);
});

test("el recorrido guarda flashcards, examen e historial y valida rutas inválidas", () => {
  assert.match(e2e, /get_by_role\("link", name="Mi ruta"\)/);
  assert.doesNotMatch(e2e, /get_by_role\("link", name="Sesiones"\)/);
  assert.match(e2e, /get_by_role\("heading", name="Mi ruta", exact=True\)/);
  assert.doesNotMatch(e2e, /get_by_role\("heading", name="Sesiones", exact=True\)/);
  assert.match(e2e, /name="Iniciar ronda adaptativa"/);
  assert.match(e2e, /for index in range\(5\):[\s\S]*name=re\.compile\("Correcta"\)/);
  assert.match(e2e, /name=re\.compile\("Puedo explicarlo"\)/);
  assert.match(e2e, /name="Comparar con la clave"/);
  assert.match(e2e, /name="Hacer el simulacro"/);
  assert.match(e2e, /completion_heading[\s\S]*to_be_focused\(\)/);
  assert.match(e2e, /name="Entregar examen"/);
  assert.match(e2e, /get_by_role\([\s\S]*"group"[\s\S]*re\.compile\(re\.escape\(question_text\)\)/);
  assert.match(e2e, /name="Anterior"[\s\S]*fieldset legend[\s\S]*to_be_focused/);
  assert.match(e2e, /result_heading[\s\S]*to_be_focused\(\)/);
  assert.match(e2e, /name="Historial de exámenes"/);
  assert.match(e2e, /name="Abrir intento"/);
  assert.match(e2e, /"\/temas\/999999999"/);
  assert.match(e2e, /"\/progreso\/examenes\/no-valida"/);
  assert.match(e2e, /"\/clases\/no-valida"/);
  assert.match(e2e, /"\/materias\/no-valida"/);
});

test("el E2E vigila red y emula reflow, touch y movimiento reducido", () => {
  assert.match(e2e, /"requestfailed"/);
  assert.match(e2e, /request\.failure/);
  assert.match(e2e, /\{"net::ERR_ABORTED", "NS_BINDING_ABORTED"\}/);
  assert.match(e2e, /request\.resource_type == "document" and request\.is_navigation_request\(\)/);
  assert.match(e2e, /next-router-prefetch/);
  assert.match(e2e, /same_origin/);
  assert.match(e2e, /request\.method == "POST"/);
  assert.match(e2e, /bool\(headers\.get\("next-action"\)\)/);
  assert.match(e2e, /bool\(headers\.get\("next-router-state-tree"\)\)/);
  assert.match(e2e, /allowed_aborts\["document-navigation"\]/);
  assert.match(e2e, /allowed_aborts\["next-prefetch"\]/);
  assert.match(e2e, /allowed_aborts\["next-server-action"\]/);
  assert.match(e2e, /response\.status >= 500/);
  assert.match(e2e, /"width": 320/);
  assert.match(e2e, /has_touch=configuration\["has_touch"\]/);
  assert.match(e2e, /reduced_motion=configuration\["reduced_motion"\]/);
  assert.match(e2e, /scrollWidth - document\.documentElement\.clientWidth/);
  assert.match(e2e, /button:visible, a\[href\]:visible/);
  assert.match(e2e, /input:not\(\[type=hidden\]\):visible/);
  assert.match(e2e, /WCAG permite una excepción para enlaces de texto en línea/);
  assert.match(e2e, /control\.labels\?\.\[0\] \|\| control/);
  assert.doesNotMatch(e2e, /Math\.hypot|Excepción de separación/);
  assert.match(e2e, /box\.width < 24 \|\| box\.height < 24/);
  assert.match(e2e, /assert_computed_reduced_motion/);
  assert.match(e2e, /maximum_duration_ms > 1/);
  assert.match(e2e, /automated reflow proxy for 200% zoom/);
  assert.doesNotMatch(e2e, /screen reader (?:verified|approved|passed)/i);
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
