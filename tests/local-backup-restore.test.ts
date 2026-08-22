import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createRestoreDatabaseName,
  RESTORE_DATABASE_MARKER,
  validateRestoreDatabaseName,
} from "../scripts/lib/local-backup-safety";

const runner = readFileSync(
  new URL("../scripts/test-local-backup-restore.ts", import.meta.url),
  "utf8",
);
const safety = readFileSync(
  new URL("../scripts/lib/local-backup-safety.ts", import.meta.url),
  "utf8",
);

test("genera únicamente nombres allowlisted y rechaza bases reales o SQL", () => {
  assert.equal(
    createRestoreDatabaseName("abcdef12-3456-7890-abcd-ef1234567890"),
    "ceneval_restore_drill_abcdef123456",
  );
  for (const unsafe of [
    "postgres",
    "ceneval-study-app",
    "ceneval_restore_drill_abcdef;drop",
    "ceneval_restore_drill_ABCDEF123456",
    "ceneval_restore_drill_short",
  ]) {
    assert.throws(() => validateRestoreDatabaseName(unsafe), /no permitido|nunca/);
  }
});

test("el runner valida local, usa subprocess args y nunca shell", () => {
  assert.match(runner, /validateLocalSupabaseStatus/);
  assert.match(runner, /sourceDatabase !== "postgres"/);
  assert.match(runner, /execFileSync\(executable, args/);
  assert.doesNotMatch(runner, /shell:\s*true|execSync\(|spawn\([^,]+,\s*\{\s*shell/);
  assert.match(runner, /PGPASSWORD: source\.password/);
  assert.match(runner, /show server_version_num/);
});

test("CREATE y DROP exigen ausencia, ownership, marker y finally", () => {
  assert.match(runner, /if \(databaseExists\(name\)\)[\s\S]*no se modificará/);
  assert.match(runner, /assertOwnedTemporaryDatabase\(name\)/);
  assert.match(runner, /pg_get_userbyid/);
  assert.ok(safety.includes(RESTORE_DATABASE_MARKER));
  assert.match(runner, /--file=-/);
  assert.match(runner, /finally \{[\s\S]*dropTemporaryDatabase[\s\S]*rmSync/);
});

test("restaura y verifica esquema, RLS, evidencia, digest y round-trip", () => {
  assert.match(runner, /"pg_dump"/);
  assert.match(runner, /"pg_restore"/);
  assert.match(runner, /--single-transaction/);
  assert.match(runner, /relrowsecurity/);
  assert.match(runner, /transcriptStorageRemoved/);
  assert.match(runner, /to_regclass\('public\.transcripts'\) is null/);
  assert.match(runner, /column_name = 'source_transcript_id'/);
  assert.match(runner, /evidenceDigest/);
  assert.match(runner, /assertClassPackageRoundTrip/);
});
