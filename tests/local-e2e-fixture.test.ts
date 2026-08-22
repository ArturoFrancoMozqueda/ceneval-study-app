import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertLocalProjectConfig,
  selectSyntheticResidueIds,
  validateLocalBaseUrl,
  validateLocalSupabaseStatus,
} from "../scripts/lib/local-e2e-safety";

function jwt(role: string) {
  return ["e30", Buffer.from(JSON.stringify({ role })).toString("base64url"), "x"].join(".");
}

const localStatus = {
  API_URL: "http://127.0.0.1:54321",
  DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  ANON_KEY: jwt("anon"),
  SERVICE_ROLE_KEY: jwt("service_role"),
};

test("acepta únicamente el project_id local esperado", () => {
  assert.doesNotThrow(() => assertLocalProjectConfig('project_id = "ceneval-study-app"'));
  assert.throws(() => assertLocalProjectConfig('project_id = "otro"'), /project_id/);
});

test("acepta el par API/DB local y roles de clave correctos", () => {
  const result = validateLocalSupabaseStatus(localStatus);
  assert.equal(result.apiUrl, "http://127.0.0.1:54321");
  assert.match(result.databaseUrl, /^postgresql:/);
});

test("rechaza hosts, puertos y roles que podrían apuntar fuera del ensayo", () => {
  assert.throws(
    () => validateLocalSupabaseStatus({ ...localStatus, API_URL: "https://example.com:54321" }),
    /loopback/,
  );
  assert.throws(
    () => validateLocalSupabaseStatus({ ...localStatus, DB_URL: "postgresql://x@127.0.0.1:5432/postgres" }),
    /puerto local/,
  );
  assert.throws(
    () => validateLocalSupabaseStatus({ ...localStatus, SERVICE_ROLE_KEY: jwt("anon") }),
    /service_role/,
  );
});

test("la URL de navegador también falla cerrada fuera del puerto local", () => {
  assert.equal(validateLocalBaseUrl("http://localhost:3000/path"), "http://localhost:3000");
  assert.throws(() => validateLocalBaseUrl("https://localhost:3000"), /protocolo/);
  assert.throws(() => validateLocalBaseUrl("http://127.0.0.1:3001"), /puerto/);
});

test("solo considera reentrante una clase con marcadores sintéticos exactos", () => {
  assert.deepEqual(
    selectSyntheticResidueIds([
      {
        id: 41,
        title: "Clase sintética de persistencia",
        subjects: { name: "Materia sintética" },
      },
    ]),
    [41],
  );
  assert.throws(
    () =>
      selectSyntheticResidueIds([
        {
          id: 99,
          title: "Clase legítima C41",
          subjects: { name: "Derecho legítimo" },
        },
      ]),
    /contenido ajeno.*no se modificará/,
  );
});

test("el runner conserva cleanup idempotente en finally y no imprime secretos", () => {
  const runner = readFileSync(
    new URL("../scripts/with-local-e2e-fixture.ts", import.meta.url),
    "utf8",
  );
  assert.match(runner, /try \{[\s\S]*finally \{[\s\S]*cleanupFixture\(service\)[\s\S]*verifyClean\(service\)/);
  assert.match(runner, /auth\.admin\.deleteUser/);
  assert.match(runner, /selectSyntheticResidueIds/);
  assert.match(runner, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(runner, /OPS_READINESS_TOKEN: readinessToken/);
  assert.match(
    runner,
    /p_package: toPersistableClassPackage\(fixture\)/,
  );
  assert.match(runner, /\.from\("classes"\)\.delete\(\)\.in\("id", ids\)/);
  assert.match(runner, /\.from\("subjects"\)\.delete\(\)/);
  assert.doesNotMatch(runner, /console\.(?:log|error)\([^\n]*(?:Password|secretKey|publishableKey)/);
  assert.doesNotMatch(runner, /console\.(?:log|error)\([^\n]*readinessToken/);
});
