import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toPersistableClassPackage } from "../lib/content/package-persistence";
import { createSyntheticTraceablePackage } from "../tests/fixtures/traceable-package";
import {
  assertLocalProjectConfig,
  selectSyntheticResidueIds,
  validateLocalBaseUrl,
  validateLocalSupabaseStatus,
} from "./lib/local-e2e-safety";

const ADMIN_EMAIL = "e2e-admin-local@example.invalid";
const STUDENT_EMAIL = "e2e-student-local@example.invalid";
const OTHER_STUDENT_EMAIL = "e2e-student-other-local@example.invalid";
const UI_SUBJECT_NAME = "Materia creada por E2E local";
const UI_SUBJECT_DESCRIPTION =
  "Registro sintético creado únicamente por el navegador E2E local.";
const UI_CLASS_TITLE = "Clase creada por E2E local";
const UI_CLASS_DESCRIPTION =
  "Borrador sintético creado únicamente por el navegador E2E local.";
const UI_CLASS_DATE = "2026-09-04";
const UI_CLASS_TEACHER = "Docente E2E local";
const fixture = createSyntheticTraceablePackage();
const syntheticReference = fixture.topics[0]!.references[0]!;
const fixtureLockPath = join(tmpdir(), "ceneval-study-e2e-fixture.lock");

function acquireFixtureLock() {
  const owner = `${process.pid}:${randomBytes(16).toString("hex")}`;
  let descriptor: number;
  try {
    descriptor = openSync(fixtureLockPath, "wx", 0o600);
  } catch {
    throw new Error(
      "Gate local: ya existe otra ejecución con el fixture E2E o quedó un lock que debe revisarse.",
    );
  }
  writeFileSync(descriptor, owner, { encoding: "utf8" });
  return { descriptor, owner };
}

function releaseFixtureLock(lock: { descriptor: number; owner: string }) {
  closeSync(lock.descriptor);
  try {
    if (readFileSync(fixtureLockPath, "utf8") === lock.owner) {
      unlinkSync(fixtureLockPath);
    }
  } catch {
    throw new Error("Gate local: no se pudo liberar el lock propio del fixture.");
  }
}

type CreatedUser = { id: string };

function readLocalStatus() {
  const configPath = fileURLToPath(
    new URL("../supabase/config.toml", import.meta.url),
  );
  assertLocalProjectConfig(readFileSync(configPath, "utf8"));
  const cliScript = fileURLToPath(
    new URL("../node_modules/supabase/dist/supabase.js", import.meta.url),
  );
  const output = execFileSync(
    process.execPath,
    [cliScript, "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return validateLocalSupabaseStatus(
    JSON.parse(output) as Record<string, unknown>,
  );
}

async function listFixtureUserIds(service: SupabaseClient) {
  const ids: string[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    for (const user of data.users) {
      if (
        user.email === ADMIN_EMAIL ||
        user.email === STUDENT_EMAIL ||
        user.email === OTHER_STUDENT_EMAIL
      ) {
        ids.push(user.id);
      }
    }
    if (data.users.length < 200) return ids;
  }
  throw new Error("Gate local: la limpieza de Auth excedió el límite seguro.");
}

async function deleteRows(
  query: PromiseLike<{ error: { message?: string } | null }>,
  label: string,
) {
  const { error } = await query;
  if (error) throw new Error(`No se pudo limpiar ${label}.`);
}

async function listUiSubjectIds(service: SupabaseClient) {
  const { data, error } = await service
    .from("subjects")
    .select("id,name,description")
    .eq("name", UI_SUBJECT_NAME);
  if (error) throw error;
  for (const row of data ?? []) {
    if (
      row.name !== UI_SUBJECT_NAME ||
      row.description !== UI_SUBJECT_DESCRIPTION
    ) {
      throw new Error(
        "Gate local: la materia reservada para E2E no tiene los marcadores sintéticos exactos.",
      );
    }
  }
  return (data ?? []).map(({ id }) => Number(id));
}

async function listUiClassIds(
  service: SupabaseClient,
  subjectIds: number[],
) {
  if (!subjectIds.length) return [];
  const { data, error } = await service
    .from("classes")
    .select("id,subject_id,title,description,class_date,teacher")
    .in("subject_id", subjectIds);
  if (error) throw error;
  for (const row of data ?? []) {
    if (
      row.title !== UI_CLASS_TITLE ||
      row.description !== UI_CLASS_DESCRIPTION ||
      row.class_date !== UI_CLASS_DATE ||
      row.teacher !== UI_CLASS_TEACHER
    ) {
      throw new Error(
        "Gate local: la materia reservada para E2E contiene una clase ajena; no se modificará.",
      );
    }
  }
  return (data ?? []).map(({ id }) => Number(id));
}

async function cleanupFixture(service: SupabaseClient) {
  const failures: string[] = [];
  const attempt = async (label: string, operation: () => Promise<void>) => {
    try {
      await operation();
    } catch {
      failures.push(label);
    }
  };

  await attempt("sesiones adaptativas sintéticas", async () => {
    const fixtureUserIds = await listFixtureUserIds(service);
    if (fixtureUserIds.length) {
      await deleteRows(
        service.from("practice_sessions").delete().in("user_id", fixtureUserIds),
        "las sesiones adaptativas sintéticas",
      );
    }
  });

  await attempt("clase creada por la interfaz E2E", async () => {
    const subjectIds = await listUiSubjectIds(service);
    const classIds = await listUiClassIds(service, subjectIds);
    if (classIds.length) {
      await deleteRows(
        service.from("classes").delete().in("id", classIds),
        "la clase creada por la interfaz E2E",
      );
    }
  });

  await attempt("clase sintética", async () => {
    const { data, error } = await service
      .from("classes")
      .select("id,title,subjects(name)")
      .eq("curriculum_code", fixture.curriculum.code);
    if (error) throw error;
    const ids = selectSyntheticResidueIds(data ?? []);
    if (ids.length) {
      await deleteRows(
        service.from("classes").delete().in("id", ids),
        "la clase sintética",
      );
    }
  });
  await attempt("referencia sintética", async () => {
    await deleteRows(
      service
        .from("legal_references")
        .delete()
        .eq("url", syntheticReference.url)
        .eq("citation", syntheticReference.citation),
      "la referencia sintética",
    );
  });
  await attempt("materia sintética", async () => {
    await deleteRows(
      service.from("subjects").delete().eq("name", fixture.subject.name),
      "la materia sintética",
    );
  });
  await attempt("materia creada por la interfaz E2E", async () => {
    const subjectIds = await listUiSubjectIds(service);
    if (subjectIds.length) {
      await deleteRows(
        service.from("subjects").delete().in("id", subjectIds),
        "la materia creada por la interfaz E2E",
      );
    }
  });
  await attempt("usuarios sintéticos", async () => {
    for (const userId of await listFixtureUserIds(service)) {
      const { error } = await service.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });

  if (failures.length) {
    throw new Error(`Falló la limpieza local: ${failures.join(", ")}.`);
  }
}

async function verifyClean(service: SupabaseClient) {
  const [classes, uiClasses, subjects, uiSubjects, references, userIds] =
    await Promise.all([
      service
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("curriculum_code", fixture.curriculum.code),
      service
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("title", UI_CLASS_TITLE),
      service
        .from("subjects")
        .select("id", { count: "exact", head: true })
        .eq("name", fixture.subject.name),
      service
        .from("subjects")
        .select("id", { count: "exact", head: true })
        .eq("name", UI_SUBJECT_NAME),
      service
        .from("legal_references")
        .select("id", { count: "exact", head: true })
        .eq("url", syntheticReference.url)
        .eq("citation", syntheticReference.citation),
      listFixtureUserIds(service),
    ]);
  for (const result of [classes, uiClasses, subjects, uiSubjects, references]) {
    if (result.error) throw new Error("No se pudo verificar la limpieza local.");
    assert.equal(result.count, 0, "La limpieza local dejó residuos.");
  }
  assert.equal(userIds.length, 0, "La limpieza local dejó usuarios sintéticos.");
}

async function createUser(
  service: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
  termsAccepted = false,
): Promise<CreatedUser> {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      ...(termsAccepted
        ? { terms_accepted_at: new Date().toISOString() }
        : {}),
    },
  });
  if (error) throw new Error("No se pudo crear una cuenta E2E local.");
  return { id: data.user.id };
}

async function prepareFixture(service: SupabaseClient) {
  const adminPassword = `Local-admin-${crypto.randomUUID()}-Aa1!`;
  const studentPassword = `Local-student-${crypto.randomUUID()}-Aa1!`;
  const otherStudentPassword = `Local-other-${crypto.randomUUID()}-Aa1!`;
  const admin = await createUser(
    service,
    ADMIN_EMAIL,
    adminPassword,
    "Administradora E2E sintética",
    true,
  );
  await createUser(
    service,
    STUDENT_EMAIL,
    studentPassword,
    "Estudiante E2E sintética",
  );
  await createUser(
    service,
    OTHER_STUDENT_EMAIL,
    otherStudentPassword,
    "Otra estudiante E2E sintética",
    true,
  );

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", admin.id)
    .select("id,role")
    .single();
  if (profileError || profile.role !== "admin") {
    throw new Error("No se pudo verificar el rol administrativo local.");
  }

  const { data: importedId, error: importError } = await service.rpc(
    "import_class_package_v12",
    { p_package: toPersistableClassPackage(fixture) },
  );
  if (importError) throw new Error("No se pudo importar el paquete E2E 1.2.");
  const classId = Number(importedId);
  if (!Number.isSafeInteger(classId) || classId <= 0) {
    throw new Error("El importador E2E no devolvió una clase válida.");
  }

  const { data: topics, error: topicsError } = await service
    .from("topics")
    .update({ approval_status: "approved" })
    .eq("class_id", classId)
    .select("id,approval_status,position");
  if (topicsError || topics.length !== fixture.topics.length) {
    throw new Error("No se pudieron aprobar todos los temas E2E.");
  }
  const topicId = Number(
    [...topics].sort((left, right) => left.position - right.position)[0]!.id,
  );

  const retrievalSeeds = Array.from({ length: 5 }, (_, index) => ({
    stable_code: `C41-R${String(index + 1).padStart(2, "0")}`,
    topic_id: topicId,
    prompt: `Pregunta adaptativa sintética ${index + 1}`,
    retrieval_type: index % 2 === 0 ? "free_recall" : "cued_recall",
    difficulty: "basic",
    estimated_seconds: 30,
    objective: "Verificar el recorrido adaptativo E2E sin usar contenido real.",
    editorial_status: "published",
  }));
  const { data: retrievalItems, error: retrievalError } = await service
    .from("retrieval_items")
    .insert(retrievalSeeds)
    .select("id,stable_code");
  if (retrievalError || !retrievalItems || retrievalItems.length !== retrievalSeeds.length) {
    throw new Error("No se pudo preparar la práctica adaptativa E2E.");
  }
  const { error: answerKeysError } = await service
    .from("retrieval_item_answer_keys")
    .insert(
      retrievalItems.map((item) => ({
        retrieval_item_id: item.id,
        required_points: [`Punto sintético de ${item.stable_code}`],
        acceptable_alternatives: ["Formulación sintética equivalente."],
        common_errors: ["Confundir el fixture con contenido académico real."],
      })),
    );
  if (answerKeysError) {
    throw new Error("No se pudieron preparar las claves adaptativas E2E.");
  }
  const { error: evidenceError } = await service
    .from("retrieval_item_evidence")
    .insert(
      retrievalItems.map((item) => ({
        retrieval_item_id: item.id,
        evidence_code: `${item.stable_code}-E1`,
        label: "Evidencia sintética exclusiva del entorno local.",
        verified_on: new Date().toISOString().slice(0, 10),
      })),
    );
  if (evidenceError) {
    throw new Error("No se pudo preparar la evidencia adaptativa E2E.");
  }

  const { error: reviewStatusError } = await service
    .from("classes")
    .update({ publication_status: "review", published_at: null })
    .eq("id", classId);
  if (reviewStatusError) throw new Error("No se pudo iniciar la revisión E2E.");

  const { data: version, error: versionError } = await service
    .from("classes")
    .select("content_version,content_digest")
    .eq("id", classId)
    .single();
  if (versionError) throw new Error("No se pudo leer la versión editorial E2E.");

  const today = new Date().toISOString().slice(0, 10);
  const { error: reviewError } = await service
    .from("class_editorial_reviews")
    .insert({
      class_id: classId,
      reviewer_id: admin.id,
      verdict: "approved",
      notes: "Dictamen sintético exclusivo de E2E local.",
      content_version: version.content_version,
      content_digest: version.content_digest,
      legal_verified_on: today,
    });
  if (reviewError) throw new Error("No se pudo registrar el dictamen E2E.");

  const { data: published, error: publishError } = await service
    .from("classes")
    .update({ publication_status: "published", published_at: new Date().toISOString() })
    .eq("id", classId)
    .select("publication_status")
    .single();
  if (publishError || published.publication_status !== "published") {
    throw new Error("El gate editorial rechazó la publicación E2E.");
  }

  return {
    adminPassword,
    classId,
    otherStudentPassword,
    studentPassword,
    topicId,
  };
}

async function runChild(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  const child = spawn(command, args, { env: environment, stdio: "inherit" });
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error("El proceso E2E terminó por una señal."));
      else resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) throw new Error("El proceso E2E local reportó un fallo.");
}

async function main() {
  const separator = process.argv.indexOf("--");
  const command = process.argv[separator + 1];
  const args = process.argv.slice(separator + 2);
  if (separator < 0 || !command) {
    throw new Error("Uso: tsx scripts/with-local-e2e-fixture.ts -- <comando>.");
  }

  const fixtureLock = acquireFixtureLock();
  try {
    const credentials = readLocalStatus();
    const baseUrl = validateLocalBaseUrl(
      process.env.E2E_BASE_URL?.trim() || "http://127.0.0.1:3100",
    );
    const service = createClient(credentials.apiUrl, credentials.secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const readinessToken = randomBytes(32).toString("base64url");

    try {
      await cleanupFixture(service);
      await verifyClean(service);
      const prepared = await prepareFixture(service);
      console.log("✓ Fixture sintético E2E preparado exclusivamente en Supabase local.");
      await runChild(command, args, {
        ...process.env,
        ADMIN_EMAIL,
        E2E_ADMIN_EMAIL: ADMIN_EMAIL,
        E2E_ADMIN_PASSWORD: prepared.adminPassword,
        E2E_BASE_URL: baseUrl,
        E2E_CLASS_ID: String(prepared.classId),
        E2E_STUDENT_EMAIL: STUDENT_EMAIL,
        E2E_OTHER_STUDENT_EMAIL: OTHER_STUDENT_EMAIL,
        E2E_OTHER_STUDENT_PASSWORD: prepared.otherStudentPassword,
        E2E_STUDENT_PASSWORD: prepared.studentPassword,
        E2E_TOPIC_ID: String(prepared.topicId),
        E2E_TOPIC_URL: `/temas/${prepared.topicId}`,
        E2E_UI_CLASS_DATE: UI_CLASS_DATE,
        E2E_UI_CLASS_DESCRIPTION: UI_CLASS_DESCRIPTION,
        E2E_UI_CLASS_TEACHER: UI_CLASS_TEACHER,
        E2E_UI_CLASS_TITLE: UI_CLASS_TITLE,
        E2E_UI_SUBJECT_DESCRIPTION: UI_SUBJECT_DESCRIPTION,
        E2E_UI_SUBJECT_NAME: UI_SUBJECT_NAME,
        NEXT_PUBLIC_SITE_URL: baseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: credentials.publishableKey,
        NEXT_PUBLIC_SUPABASE_URL: credentials.apiUrl,
        OPS_READINESS_TOKEN: readinessToken,
        SUPABASE_LOCAL_DB_URL: credentials.databaseUrl,
        SUPABASE_SECRET_KEY: credentials.secretKey,
      });
    } finally {
      await cleanupFixture(service);
      await verifyClean(service);
      console.log(
        "✓ Cleanup E2E verificado: 0 clases, 0 materias, 0 referencias y 0 usuarios sintéticos, incluidos los creados desde la interfaz.",
      );
    }
  } finally {
    releaseFixtureLock(fixtureLock);
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? `✗ Fixture E2E local rechazado: ${error.message}` : "✗ Fixture E2E local rechazado.",
  );
  process.exitCode = 1;
});
