import assert from "node:assert/strict";
import nextConfig from "../next.config";

async function main() {
  assert.equal(typeof nextConfig.headers, "function");

  const rules = await nextConfig.headers!();
  const allPaths = rules.find(({ source }) => source === "/:path*");
  assert.ok(allPaths, "Falta la regla global de cabeceras.");

  const headers = new Map(
    allPaths.headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(
    headers.get("strict-transport-security"),
    "max-age=31536000",
  );
  assert.match(
    headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  const enforced = headers.get("content-security-policy") ?? "";
  assert.match(enforced, /base-uri 'self'/);
  assert.match(enforced, /form-action 'self'/);
  assert.match(enforced, /default-src 'self'/);
  assert.match(enforced, /script-src 'self' 'unsafe-inline'/);
  assert.match(enforced, /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/);
  assert.match(enforced, /http:\/\/127\.0\.0\.1:\*/);
  assert.match(enforced, /object-src 'none'/);
  assert.equal(headers.get("content-security-policy-report-only"), undefined);
  assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/);

  console.log("Cabeceras HTTP de seguridad: configuración aprobada.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
