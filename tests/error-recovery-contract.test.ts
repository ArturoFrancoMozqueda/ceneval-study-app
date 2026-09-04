import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const path of ["app/error.tsx", "app/global-error.tsx"]) {
  test(`${path} usa la API estable de recuperación de Next.js 16.3`, () => {
    const source = readFileSync(path, "utf8");

    assert.match(source, /retry:\s*\(\) => void/);
    assert.match(source, /onClick=\{\(\) => retry\(\)\}/);
    assert.doesNotMatch(source, /unstable_retry/);
  });
}
