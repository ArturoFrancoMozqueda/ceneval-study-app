import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const plan = readFileSync(
  new URL("../docs/INCIDENT_RESPONSE.md", import.meta.url),
  "utf8",
);

test("el plan de incidentes define responsables, tiempos y comunicación", () => {
  for (const required of [
    "Responsabilidades y tiempos",
    "SEV-1",
    "15 min",
    "30 min",
    "Procedimiento",
    "Comunicación",
    "Cierre verificable",
    "cinco días hábiles",
  ]) {
    assert.ok(plan.includes(required), `Falta el control operativo: ${required}`);
  }
});

test("el plan protege evidencia y no promete capacidad que aún no existe", () => {
  assert.match(plan, /No copies cookies, tokens, correos/);
  assert.match(plan, /rollback de Vercel no revierte la base/);
  assert.match(plan, /Mientras no exista[\s\S]*no como un SLA ofrecido/);
  assert.match(plan, /Antes de invitar estudiantes[\s\S]*canal de soporte real/);
  assert.doesNotMatch(plan, /OPS_READINESS_TOKEN\s*=|SUPABASE_SECRET_KEY\s*=/);
});
