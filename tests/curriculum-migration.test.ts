import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260821021153_add_curriculum_session_metadata.sql",
    import.meta.url,
  ),
  "utf8",
);

test("el relleno historico solo referencia clases existentes", () => {
  assert.match(
    migration,
    /join\s+public\.classes\s+as\s+classes\s+on\s+classes\.id\s*=\s*sources\.class_id/i,
  );
  assert.doesNotMatch(
    migration,
    /insert\s+into\s+public\.class_audio_sources[\s\S]*?\nvalues\s*\n/i,
  );
});
