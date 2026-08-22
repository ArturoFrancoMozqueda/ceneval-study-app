import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const originalMigration = readFileSync(
  "supabase/migrations/20260821203000_persist_traceable_packages.sql",
  "utf8",
);
const lintMigration = readFileSync(
  "supabase/migrations/20260822022138_remove_import_loop_shadowing.sql",
  "utf8",
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

function importFunction(sql: string) {
  const match = sql.match(
    /create(?: or replace)? function private\.import_class_package_v12\(p_package jsonb\)[\s\S]*?\$\$;/,
  );
  assert.ok(match, "la migración debe definir private.import_class_package_v12(jsonb)");
  return match[0].replaceAll("\r\n", "\n");
}

test("la migración nueva solo elimina las cuatro declaraciones redundantes", () => {
  let expected = importFunction(originalMigration).replace(
    "create function private.import_class_package_v12",
    "create or replace function private.import_class_package_v12",
  );

  for (const name of ["topic_index", "item_index", "question_index", "option_index"]) {
    expected = expected.replace(`  ${name} integer;\n`, "");
  }

  assert.equal(importFunction(lintMigration), expected);
  assert.match(lintMigration, /returns bigint\s+language plpgsql\s+security invoker\s+set search_path = ''/);
  assert.match(lintMigration, /^  reference_index integer;$/m);
});

test("el lint de base es local y falla ante cualquier warning", () => {
  assert.equal(
    packageJson.scripts["db:lint:local"],
    "supabase db lint --local --level warning --fail-on warning",
  );
  assert.match(packageJson.scripts["test:local"], /npm run test:db-lint-contract/);
  assert.doesNotMatch(packageJson.scripts["db:lint:local"], /--linked|--db-url|project-ref/);
});
