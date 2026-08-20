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
  assert.match(
    headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  assert.match(headers.get("content-security-policy") ?? "", /base-uri 'self'/);
  assert.match(headers.get("content-security-policy") ?? "", /form-action 'self'/);
  assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/);

  console.log("Cabeceras HTTP de seguridad: configuración aprobada.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
