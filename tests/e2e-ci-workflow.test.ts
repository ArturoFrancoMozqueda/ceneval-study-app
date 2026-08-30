import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/e2e-local.yml", import.meta.url),
  "utf8",
);
const runner = readFileSync(
  new URL("../scripts/run-study-e2e-ci.ts", import.meta.url),
  "utf8",
);
const requirements = readFileSync(
  new URL("../scripts/requirements-e2e.txt", import.meta.url),
  "utf8",
);

test("el E2E nocturno usa únicamente Supabase local y Chromium efímeros", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:[\s\S]*cron: "17 9 \* \* \*"/);
  assert.match(workflow, /E2E_BASE_URL: http:\/\/127\.0\.0\.1:3100/);
  assert.match(workflow, /npx --no-install supabase start/);
  assert.match(workflow, /npm run test:e2e:ci/);
  assert.match(workflow, /if: always\(\)[\s\S]*supabase stop --no-backup/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.doesNotMatch(workflow, /secrets\./);
});

test("las actions y dependencias Python quedan fijadas", () => {
  const uses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map(
    (match) => match[1],
  );
  assert.ok(uses.length > 0);
  for (const action of uses) {
    assert.match(action, /@[a-f0-9]{40}$/);
  }
  for (const line of requirements.trim().split("\n")) {
    assert.match(line.trim(), /^[A-Za-z_]+==\d+(?:\.\d+)+$/);
  }
});

test("el lanzador CI falla cerrado y detiene solo el servidor que creó", () => {
  assert.match(runner, /process\.platform === "win32"/);
  assert.match(runner, /process\.env\.E2E_BASE_URL !== baseUrl/);
  assert.match(runner, /El puerto E2E dedicado ya está ocupado/);
  assert.match(runner, /\/api\/health\/live/);
  assert.match(runner, /process\.kill\(-server\.pid, "SIGTERM"\)/);
  assert.match(runner, /finally \{[\s\S]*stopOwnedServer\(server\)/);
  assert.doesNotMatch(runner, /SUPABASE_SECRET_KEY|\.env\.local/);
});
