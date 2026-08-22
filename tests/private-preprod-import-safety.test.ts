import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCurriculumManifest,
  assertExistingCurriculumPrefix,
  assertPrivatePreprodTarget,
  EXPECTED_CURRICULUM_CODES,
} from "../scripts/lib/private-preprod-import-safety";

const validTarget = {
  confirmation: true,
  execute: true,
  privateAccessOnly: "true",
  secretKey: "sb_secret_example",
  siteUrl: "https://ceneval-study-app.vercel.app",
  supabaseUrl: "https://qcseoivljzuxzqeaxfly.supabase.co",
};

test("falla cerrado ante confirmación, destino, modo o clave incorrectos", () => {
  for (const invalid of [
    { ...validTarget, confirmation: false },
    { ...validTarget, execute: false },
    { ...validTarget, privateAccessOnly: "false" },
    { ...validTarget, secretKey: "public" },
    { ...validTarget, siteUrl: "https://otro.vercel.app" },
    { ...validTarget, supabaseUrl: "https://otro.supabase.co" },
  ]) {
    assert.throws(() => assertPrivatePreprodTarget(invalid));
  }
  assert.doesNotThrow(() => assertPrivatePreprodTarget(validTarget));
});

test("la reanudación solo acepta un prefijo continuo desde C01", () => {
  assert.doesNotThrow(() => assertExistingCurriculumPrefix([]));
  assert.doesNotThrow(() =>
    assertExistingCurriculumPrefix(EXPECTED_CURRICULUM_CODES.slice(0, 23)),
  );
  assert.doesNotThrow(() =>
    assertExistingCurriculumPrefix(EXPECTED_CURRICULUM_CODES),
  );
  assert.throws(() => assertExistingCurriculumPrefix(["C02"]));
  assert.throws(() => assertExistingCurriculumPrefix(["C01", "C03"]));
});

test("el manifiesto exige exactamente C01–C57", () => {
  assert.doesNotThrow(() =>
    assertCurriculumManifest([...EXPECTED_CURRICULUM_CODES].reverse()),
  );
  assert.throws(() => assertCurriculumManifest(EXPECTED_CURRICULUM_CODES.slice(1)));
  assert.throws(() =>
    assertCurriculumManifest([...EXPECTED_CURRICULUM_CODES, "C58"]),
  );
  assert.throws(() =>
    assertCurriculumManifest([
      ...EXPECTED_CURRICULUM_CODES.slice(0, -1),
      "C56",
    ]),
  );
});
