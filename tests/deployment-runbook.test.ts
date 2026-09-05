import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runbook = readFileSync(
  new URL("../docs/DEPLOYMENT_RUNBOOK.md", import.meta.url),
  "utf8",
);

test("el runbook liga release a commit, CI, preview y rollback conocidos", () => {
  for (const required of [
    "Commit completo",
    "URL de CI verde",
    "Deployment de producción anterior",
    "Preview ID y URL",
    "git status --short",
    "git rev-parse HEAD",
    "vercel inspect <PREVIEW_ID_O_URL>",
    "npm.cmd run ops:preflight:preview",
    "npm.cmd run ops:preflight:production",
    "vercel build --prod",
    "vercel deploy --prebuilt --prod",
    "production-build-manifest.local.json",
    "vercel rollback <DEPLOYMENT_ANTERIOR>",
  ]) {
    assert.ok(runbook.includes(required), `Falta el gate operativo: ${required}`);
  }
  assert.doesNotMatch(runbook, /vercel promote/);
  assert.doesNotMatch(runbook, /^\s*vercel --prod\b/m);
  assert.match(runbook, /No uses\s+`vercel --prod` sin `--prebuilt`/);
  assert.match(runbook, /NEXT_PUBLIC_\*` quedan congeladas/);
  assert.match(runbook, /Vercel está conectado a GitHub/);
  assert.match(runbook, /push del commit exacto a `main`/);
  assert.match(runbook, /mismo SHA/);
  assert.match(runbook, /terminar en verde\/?`READY`/);
});

test("el runbook exige acceso privado, readiness protegida y logs Hobby", () => {
  assert.match(runbook, /PRIVATE_ACCESS_ONLY=true/);
  assert.match(runbook, /OPS_READINESS_TOKEN/);
  assert.match(runbook, /\[SENSITIVE\]/);
  assert.match(runbook, /preflight local falla de forma\s+intencional/);
  assert.match(runbook, /build real de\s+Vercel/);
  assert.match(runbook, /Authorization: Bearer/);
  assert.match(runbook, /sin autorización responde 404 genérico/);
  assert.match(runbook, /Runtime Logs/);
  assert.match(runbook, /Hobby no ofrece[\s\S]*alertas continuas/);
  assert.doesNotMatch(runbook, /NEXT_PUBLIC_OPS_READINESS_TOKEN/);
});

test("el rollback de aplicación nunca promete revertir la base", () => {
  assert.match(runbook, /no aplica ni revierte base de datos/i);
  assert.match(runbook, /no revierte migraciones, Auth, contenido ni secretos/i);
  assert.match(runbook, /Nunca ejecutes SQL inverso automáticamente/);
  assert.match(runbook, /compatible con el esquema actual/);
});

test("el documento no contiene tokens ni descarga una CLI flotante", () => {
  assert.doesNotMatch(runbook, /vercel@[Ll]atest|npm (?:exec|install).*vercel/);
  assert.doesNotMatch(runbook, /(?:OPS_READINESS_TOKEN|VERCEL_TOKEN)\s*=\s*[A-Za-z0-9_-]{16,}/);
  assert.match(runbook, /versión exacta y aprobada de Vercel CLI/);
});
