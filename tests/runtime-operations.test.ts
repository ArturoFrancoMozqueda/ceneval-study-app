import assert from "node:assert/strict";
import test from "node:test";
import { hasValidReadinessAuthorization } from "../lib/operations/readiness-auth";
import { validateBuildEnvironment, validateRuntimeEnvironment } from "../lib/operations/runtime-env";
import { classifyOperationalError } from "../lib/operations/safe-log";
import { GET as live } from "../app/api/health/live/route";
import { GET as ready } from "../app/api/health/ready/route";
import { NextRequest, NextResponse } from "next/server";
import { proxyWithSessionUpdater } from "../proxy";

const validEnvironment = {
  ADMIN_EMAIL: "admin@example.test",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  OPS_READINESS_TOKEN: "readiness_token_12345678901234567890",
  SUPABASE_SECRET_KEY: "sb_secret_123456789012345678901234567890",
};

test("el preflight separa build de runtime y valida credenciales", () => {
  assert.equal(validateBuildEnvironment(validEnvironment).siteUrl, "http://127.0.0.1:3000");
  assert.equal(validateRuntimeEnvironment(validEnvironment).adminEmail, "admin@example.test");
  assert.throws(
    () => validateRuntimeEnvironment({ ...validEnvironment, OPS_READINESS_TOKEN: "corto" }),
    /OPS_READINESS_TOKEN/,
  );
});

test("producción exige HTTPS sin revelar valores", () => {
  assert.throws(
    () => validateRuntimeEnvironment({ ...validEnvironment, VERCEL_ENV: "production" }),
    /NEXT_PUBLIC_SUPABASE_URL debe usar HTTPS/,
  );
  assert.throws(
    () => validateRuntimeEnvironment({ ...validEnvironment, SUPABASE_SECRET_KEY: "" }),
    /^Error: Configuración inválida: falta SUPABASE_SECRET_KEY\.$/,
  );
});

test("clasifica claves Supabase y rechaza rutas o placeholders", () => {
  assert.throws(
    () => validateRuntimeEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validEnvironment.SUPABASE_SECRET_KEY,
    }),
    /rol esperado/,
  );
  const jwt = (role: string) => [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ role })).toString("base64url"),
    "signature_for_runtime_classification",
  ].join(".");
  assert.doesNotThrow(() => validateRuntimeEnvironment({
    ...validEnvironment,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon"),
    SUPABASE_SECRET_KEY: jwt("service_role"),
  }));
  assert.throws(
    () => validateRuntimeEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("service_role"),
    }),
    /rol esperado/,
  );
  assert.throws(
    () => validateRuntimeEnvironment({
      ...validEnvironment,
      SUPABASE_SECRET_KEY: validEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
    /rol esperado/,
  );
  assert.throws(
    () => validateBuildEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/rest/v1",
    }),
    /ruta o placeholder/,
  );
  assert.throws(
    () => validateBuildEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
    }),
    /ruta o placeholder/,
  );
  assert.throws(
    () => validateBuildEnvironment(validEnvironment, { production: true }),
    /HTTPS/,
  );
});

test("la autorización readiness es Bearer y timing-safe", () => {
  const token = validEnvironment.OPS_READINESS_TOKEN;
  assert.equal(hasValidReadinessAuthorization(`Bearer ${token}`, token), true);
  assert.equal(hasValidReadinessAuthorization(`Bearer ${token}x`, token), false);
  assert.equal(hasValidReadinessAuthorization(null, token), false);
});

test("liveness es pública, mínima y no cacheable", async () => {
  const response = live();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(await response.json(), { status: "live" });
});

test("proxy omite sesión solo en los dos probes exactos", async () => {
  let calls = 0;
  const updater = async () => {
    calls += 1;
    return NextResponse.next();
  };
  await proxyWithSessionUpdater(
    new NextRequest("http://localhost/api/health/live"),
    updater,
  );
  await proxyWithSessionUpdater(
    new NextRequest("http://localhost/api/health/ready"),
    updater,
  );
  assert.equal(calls, 0);
  await proxyWithSessionUpdater(
    new NextRequest("http://localhost/api/health/live/extra"),
    updater,
  );
  await proxyWithSessionUpdater(
    new NextRequest("http://localhost/api/private"),
    updater,
  );
  assert.equal(calls, 2);
});

test("readiness sin autorización devuelve 404 y no consulta la dependencia", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  };
  try {
    const response = await ready(new Request("http://localhost/api/health/ready"));
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { status: "not_found" });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("readiness autorizada comprueba Supabase sin devolver datos", async () => {
  const originalFetch = globalThis.fetch;
  const previous = Object.fromEntries(
    Object.keys(validEnvironment).map((name) => [name, process.env[name]]),
  );
  let requestedUrl = "";
  Object.assign(process.env, validEnvironment);
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(null, { status: 200 });
  };
  try {
    const response = await ready(
      new Request("http://localhost/api/health/ready", {
        headers: { Authorization: `Bearer ${validEnvironment.OPS_READINESS_TOKEN}` },
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ready" });
    assert.match(requestedUrl, /\/profiles\?select=id&limit=0$/);
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("readiness falla genérico y el log no incluye el error", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const previous = Object.fromEntries(
    Object.keys(validEnvironment).map((name) => [name, process.env[name]]),
  );
  const lines: string[] = [];
  Object.assign(process.env, validEnvironment);
  globalThis.fetch = async () => {
    throw new Error(`falló ${validEnvironment.SUPABASE_SECRET_KEY}`);
  };
  console.error = (...values: unknown[]) => lines.push(values.join(" "));
  try {
    const response = await ready(
      new Request("http://localhost/api/health/ready", {
        headers: { Authorization: `Bearer ${validEnvironment.OPS_READINESS_TOKEN}` },
      }),
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "not_ready" });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].includes(validEnvironment.SUPABASE_SECRET_KEY), false);
    const logged = JSON.parse(lines[0]) as Record<string, unknown>;
    assert.equal(typeof logged.durationMs, "number");
    delete logged.durationMs;
    assert.deepEqual(logged, {
      errorKind: "unknown",
      event: "readiness_check",
      level: "error",
      status: "failed",
    });
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("el diagnóstico operacional nunca serializa mensajes ni metadata", () => {
  const secret = "secret_key_that_must_never_appear";
  const diagnostic = classifyOperationalError({
    code: "PGRST301",
    details: secret,
    message: `falló ${secret}`,
    stack: secret,
  });
  const serialized = JSON.stringify(diagnostic);
  assert.deepEqual(diagnostic, { errorCode: "PGRST301", errorKind: "dependency" });
  assert.equal(serialized.includes(secret), false);
});

test("los puntos de datos no vuelven a registrar mensajes o IDs internos", async () => {
  const { readFile } = await import("node:fs/promises");
  const paths = [
    "app/actions/academic.ts",
    "lib/data/academic.ts",
    "lib/data/exam-history.ts",
    "lib/data/subject-progress.ts",
    "app/progreso/examenes/error.tsx",
  ];
  const source = (await Promise.all(paths.map((path) => readFile(path, "utf8")))).join("\n");
  assert.doesNotMatch(source, /\[Supabase\]/);
  assert.doesNotMatch(source, /console\.(?:error|warn)\([^)]*\.message/);
  assert.doesNotMatch(source, /attempt=\$\{attempt\.id\}/);
  assert.doesNotMatch(source, /console\.error\(error\)/);
});
