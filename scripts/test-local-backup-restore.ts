import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { assertClassPackageRoundTrip } from "../lib/content/package-roundtrip";
import { createSyntheticTraceablePackage } from "../tests/fixtures/traceable-package";
import {
  createRestoreDatabaseName,
  RESTORE_DATABASE_MARKER,
  validateRestoreDatabaseName,
} from "./lib/local-backup-safety";
import { validateLocalSupabaseStatus } from "./lib/local-e2e-safety";

type DatabaseConnection = {
  database: string;
  host: string;
  password: string;
  port: string;
  user: string;
};

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable local ${name}.`);
  return value;
};

const credentials = validateLocalSupabaseStatus({
  API_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  DB_URL: required("SUPABASE_LOCAL_DB_URL"),
  PUBLISHABLE_KEY: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  SECRET_KEY: required("SUPABASE_SECRET_KEY"),
});
const sourceUrl = new URL(credentials.databaseUrl);
const sourceDatabase = decodeURIComponent(sourceUrl.pathname.slice(1));
if (sourceDatabase !== "postgres" || decodeURIComponent(sourceUrl.username) !== "postgres") {
  throw new Error("Gate local: la fuente no es la base local esperada.");
}
const source: DatabaseConnection = {
  database: sourceDatabase,
  host: sourceUrl.hostname.replace(/^\[|\]$/g, ""),
  password: decodeURIComponent(sourceUrl.password),
  port: sourceUrl.port,
  user: decodeURIComponent(sourceUrl.username),
};
const classId = Number(required("E2E_CLASS_ID"));
if (!Number.isSafeInteger(classId) || classId <= 0) {
  throw new Error("Gate local: E2E_CLASS_ID no es válido.");
}

let checkpoint = "inicio";

function run(
  executable: "pg_dump" | "pg_restore" | "psql",
  args: string[],
  options: { input?: string } = {},
) {
  return execFileSync(executable, args, {
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: source.password },
    input: options.input,
    maxBuffer: 64 * 1024 * 1024,
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  }).trim();
}

function postgresArgs(database: string) {
  validateRestoreDatabaseName(database);
  return [
    "--host", source.host,
    "--port", source.port,
    "--username", source.user,
    "--dbname", database,
  ];
}

function sourceArgs() {
  return [
    "--host", source.host,
    "--port", source.port,
    "--username", source.user,
    "--dbname", source.database,
  ];
}

function psql(
  database: string,
  sql: string,
  variables: Record<string, string> = {},
) {
  const connectionArgs = database === source.database
    ? sourceArgs()
    : postgresArgs(database);
  const variableArgs = Object.entries(variables).flatMap(([name, value]) => [
    "--set", `${name}=${value}`,
  ]);
  return run("psql", [
    ...connectionArgs,
    "--no-psqlrc",
    "--set", "ON_ERROR_STOP=1",
    ...variableArgs,
    "--tuples-only",
    "--no-align",
    "--file=-",
  ], { input: sql });
}

function assertPostgres17() {
  for (const executable of ["pg_dump", "pg_restore", "psql"] as const) {
    const version = run(executable, ["--version"]);
    if (!/\b17\./.test(version)) {
      throw new Error(`Gate local: ${executable} debe ser PostgreSQL 17.`);
    }
  }
  const serverVersion = psql(source.database, "show server_version_num;");
  if (!/^17\d{4}$/.test(serverVersion)) {
    throw new Error("Gate local: el servidor debe ser PostgreSQL 17.");
  }
}

function databaseExists(name: string) {
  validateRestoreDatabaseName(name);
  return psql(
    source.database,
    "select count(*) from pg_catalog.pg_database where datname = :'temp_db';",
    { temp_db: name },
  ) === "1";
}

function assertOwnedTemporaryDatabase(name: string, requireMarker = true) {
  validateRestoreDatabaseName(name);
  const ownership = psql(
    source.database,
    "select pg_catalog.pg_get_userbyid(datdba) || '|' || coalesce(pg_catalog.shobj_description(oid, 'pg_database'), '') from pg_catalog.pg_database where datname = :'temp_db';",
    { temp_db: name },
  );
  const [owner, marker] = ownership.split("|", 2);
  if (owner !== source.user || (requireMarker && marker !== RESTORE_DATABASE_MARKER)) {
    throw new Error("Gate local: la base temporal no tiene propiedad verificable.");
  }
}

function createTemporaryDatabase(name: string, onCreated: () => void) {
  validateRestoreDatabaseName(name);
  if (databaseExists(name)) {
    throw new Error("Gate local: la base temporal ya existe; no se modificará.");
  }
  psql(
    source.database,
    'create database :"temp_db" template template0;',
    { temp_db: name },
  );
  onCreated();
  psql(
    source.database,
    `comment on database :"temp_db" is '${RESTORE_DATABASE_MARKER}';`,
    { temp_db: name },
  );
  assertOwnedTemporaryDatabase(name);
}

function dropTemporaryDatabase(name: string, createdThisRun = false) {
  validateRestoreDatabaseName(name);
  if (!databaseExists(name)) return;
  assertOwnedTemporaryDatabase(name, !createdThisRun);
  psql(
    source.database,
    "select pg_catalog.pg_terminate_backend(pid) from pg_catalog.pg_stat_activity where datname = :'temp_db' and pid <> pg_catalog.pg_backend_pid();",
    { temp_db: name },
  );
  psql(
    source.database,
    'drop database :"temp_db";',
    { temp_db: name },
  );
  if (databaseExists(name)) {
    throw new Error("La base temporal no se eliminó.");
  }
}

function queryJson(database: string, sql: string) {
  const output = psql(database, sql, { class_id: String(classId) });
  return JSON.parse(output) as unknown;
}

function readFingerprint(database: string) {
  return queryJson(
    database,
    `select json_build_object(
      'class', (select json_build_object(
        'title', title,
        'status', publication_status,
        'version', content_version,
        'digest', content_digest
      ) from public.classes where id = :'class_id'::bigint),
      'topics', (select count(*) from public.topics where class_id = :'class_id'::bigint),
      'journeys', (select count(*) from public.topic_learning_journeys journey join public.topics topic on topic.id = journey.topic_id where topic.class_id = :'class_id'::bigint),
      'materials', (select count(*) from public.study_materials material join public.topics topic on topic.id = material.topic_id where topic.class_id = :'class_id'::bigint),
      'flashcards', (select count(*) from public.flashcards card join public.topics topic on topic.id = card.topic_id where topic.class_id = :'class_id'::bigint),
      'questions', (select count(*) from public.exam_questions question join public.exams exam on exam.id = question.exam_id join public.topics topic on topic.id = exam.topic_id where topic.class_id = :'class_id'::bigint),
      'answerKeys', (select count(*) from public.exam_answer_keys answer_key join public.exam_questions question on question.id = answer_key.question_id join public.exams exam on exam.id = question.exam_id join public.topics topic on topic.id = exam.topic_id where topic.class_id = :'class_id'::bigint),
      'evidence', (select count(*) from public.class_evidence where class_id = :'class_id'::bigint),
      'artifacts', (select count(*) from public.editorial_artifacts where class_id = :'class_id'::bigint),
      'links', (select count(*) from public.editorial_artifact_evidence link join public.editorial_artifacts artifact on artifact.id = link.artifact_id where artifact.class_id = :'class_id'::bigint),
      'transcriptDigest', (select md5(original_text) from public.transcripts where class_id = :'class_id'::bigint),
      'evidenceDigest', (select md5(string_agg(evidence_key || ':' || locator::text, '|' order by evidence_key)) from public.class_evidence where class_id = :'class_id'::bigint)
    );`,
  );
}

function verifyRestoredDatabase(database: string, expectedFingerprint: unknown) {
  checkpoint = "verificación del esquema restaurado";
  const schemaCheck = psql(
    database,
    `select count(*) from (values
      (to_regclass('public.classes')),
      (to_regclass('public.class_evidence')),
      (to_regclass('public.topic_learning_journeys')),
      (to_regclass('public.editorial_artifacts')),
      (to_regclass('public.editorial_artifact_evidence')),
      (to_regclass('public.exam_answer_keys'))
    ) as required(regclass_name) where regclass_name is not null;`,
  );
  if (schemaCheck !== "6") throw new Error("La restauración perdió tablas requeridas.");
  const rlsCheck = psql(
    database,
    "select count(*) from pg_catalog.pg_class where oid in ('public.class_evidence'::regclass, 'public.editorial_artifacts'::regclass, 'public.exam_answer_keys'::regclass) and relrowsecurity;",
  );
  if (rlsCheck !== "3") throw new Error("La restauración perdió RLS.");

  const actualFingerprint = readFingerprint(database);
  if (JSON.stringify(actualFingerprint) !== JSON.stringify(expectedFingerprint)) {
    throw new Error("La huella de datos restaurada no coincide con la fuente.");
  }

  checkpoint = "round-trip 1.2 restaurado";
  const exported = queryJson(
    database,
    "select public.export_class_package_v12(:'class_id'::bigint);",
  );
  assertClassPackageRoundTrip(createSyntheticTraceablePackage(), exported);
}

async function main() {
  assertPostgres17();
  const temporaryDatabase = createRestoreDatabaseName();
  const backupRoot = mkdtempSync(join(tmpdir(), "ceneval-local-restore-"));
  const resolvedBackupRoot = resolve(backupRoot);
  const resolvedTemp = resolve(tmpdir()) + sep;
  if (!resolvedBackupRoot.startsWith(resolvedTemp)) {
    throw new Error("Gate local: el respaldo temporal no está bajo TEMP.");
  }
  const backupFile = join(resolvedBackupRoot, "database.dump");
  let databaseCreated = false;

  try {
    checkpoint = "huella de origen";
    const expectedFingerprint = readFingerprint(source.database);
    checkpoint = "exportación real";
    run("pg_dump", [
      ...sourceArgs(),
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--schema=auth",
      "--schema=private",
      "--schema=public",
      "--schema=supabase_migrations",
      "--file", backupFile,
    ]);

    checkpoint = "creación de base temporal";
    createTemporaryDatabase(temporaryDatabase, () => {
      databaseCreated = true;
    });
    psql(temporaryDatabase, "drop schema public cascade;");
    checkpoint = "restauración real";
    run("pg_restore", [
      ...postgresArgs(temporaryDatabase),
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      "--single-transaction",
      backupFile,
    ]);
    verifyRestoredDatabase(temporaryDatabase, expectedFingerprint);
    console.log("[OK] Backup/restore PG17 local verificado con esquema, datos, evidencia y round-trip 1.2.");
  } finally {
    if (databaseCreated) dropTemporaryDatabase(temporaryDatabase, true);
    rmSync(resolvedBackupRoot, { force: true, recursive: true });
    if (databaseExists(temporaryDatabase)) {
      throw new Error("Cleanup falló: la base temporal permanece.");
    }
    console.log("[OK] Cleanup restore drill: 0 bases temporales y 0 artefactos propios.");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error
    ? error.message.replace(/https?:\/\/\S+/gi, "[URL]").replace(/[A-Za-z0-9_-]{32,}/g, "[dato]")
    : "Error desconocido";
  console.error(`[FAIL] backup/restore checkpoint=${checkpoint}: ${message}`);
  process.exitCode = 1;
});
