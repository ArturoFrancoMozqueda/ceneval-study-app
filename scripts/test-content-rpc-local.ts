import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertClassPackageRoundTrip, countClassPackage } from "../lib/content/package-roundtrip";
import { createSyntheticTraceablePackage } from "../tests/fixtures/traceable-package";

type LocalCredentials = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

type DatabaseCounts = {
  classes: number;
  audioSources: number;
  transcripts: number;
  topics: number;
  learningJourneys: number;
  materials: number;
  conceptMaps: number;
  conceptMapNodes: number;
  references: number;
  flashcards: number;
  exams: number;
  examQuestions: number;
  examOptions: number;
  answerKeys: number;
  evidenceEntries: number;
  artifacts: number;
  evidenceLinks: number;
};

const fixture = createSyntheticTraceablePackage();
const syntheticReference = fixture.topics[0]!.references[0]!;
const syntheticEmail = `rpc-local-${Date.now()}@example.invalid`;
const syntheticPassword = `Local-only-${crypto.randomUUID()}-Aa1!`;

function requireLoopback(rawUrl: string): string {
  const url = new URL(rawUrl);
  const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  if (!loopbackHosts.has(url.hostname)) {
    throw new Error(
      `Prueba cancelada: ${url.hostname} no es loopback. Este comando nunca opera contra Supabase remoto.`,
    );
  }
  if (!(url.protocol === "http:" || url.protocol === "https:")) {
    throw new Error("Prueba cancelada: la URL local debe usar HTTP o HTTPS.");
  }
  return url.toString().replace(/\/$/, "");
}

function readLocalCredentials(): LocalCredentials {
  const configuredUrl = process.env.SUPABASE_LOCAL_URL?.trim();
  const configuredAnon = process.env.SUPABASE_LOCAL_ANON_KEY?.trim();
  const configuredService = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY?.trim();
  if (configuredUrl || configuredAnon || configuredService) {
    if (!configuredUrl || !configuredAnon || !configuredService) {
      throw new Error(
        "Define juntas SUPABASE_LOCAL_URL, SUPABASE_LOCAL_ANON_KEY y SUPABASE_LOCAL_SERVICE_ROLE_KEY.",
      );
    }
    return {
      url: requireLoopback(configuredUrl),
      anonKey: configuredAnon,
      serviceRoleKey: configuredService,
    };
  }

  const cliScript = fileURLToPath(
    new URL("../node_modules/supabase/dist/supabase.js", import.meta.url),
  );
  const output = execFileSync(
    process.execPath,
    [cliScript, "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const status = JSON.parse(output) as Record<string, unknown>;
  const url = typeof status.API_URL === "string" ? status.API_URL : "";
  const anonKey = typeof status.ANON_KEY === "string" ? status.ANON_KEY : "";
  const serviceRoleKey =
    typeof status.SERVICE_ROLE_KEY === "string" ? status.SERVICE_ROLE_KEY : "";
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase local no entregó API_URL, ANON_KEY y SERVICE_ROLE_KEY. Ejecuta `supabase start`.",
    );
  }
  return { url: requireLoopback(url), anonKey, serviceRoleKey };
}

function rpc(client: SupabaseClient, functionName: string, args: object) {
  return client.rpc(functionName, args);
}

async function exactCount(
  client: SupabaseClient,
  table: string,
  column: string,
  values: number[],
): Promise<number> {
  if (values.length === 0) return 0;
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true })
    .in(column, values);
  if (error) throw error;
  return count ?? 0;
}

async function readDatabaseCounts(
  service: SupabaseClient,
  classId: number,
): Promise<DatabaseCounts> {
  const { data: topics, error: topicsError } = await service
    .from("topics")
    .select("id")
    .eq("class_id", classId);
  if (topicsError) throw topicsError;
  const topicIds = (topics ?? []).map(({ id }) => Number(id));

  const { data: maps, error: mapsError } = await service
    .from("concept_maps")
    .select("id,nodes")
    .in("topic_id", topicIds);
  if (mapsError) throw mapsError;
  const conceptMapNodes = (maps ?? []).reduce(
    (total, map) => total + (Array.isArray(map.nodes) ? map.nodes.length : 0),
    0,
  );

  const { data: exams, error: examsError } = await service
    .from("exams")
    .select("id")
    .in("topic_id", topicIds);
  if (examsError) throw examsError;
  const examIds = (exams ?? []).map(({ id }) => Number(id));
  const { data: questions, error: questionsError } = await service
    .from("exam_questions")
    .select("id")
    .in("exam_id", examIds);
  if (questionsError) throw questionsError;
  const questionIds = (questions ?? []).map(({ id }) => Number(id));

  const { data: artifacts, error: artifactsError } = await service
    .from("editorial_artifacts")
    .select("id")
    .eq("class_id", classId);
  if (artifactsError) throw artifactsError;
  const artifactIds = (artifacts ?? []).map(({ id }) => Number(id));

  const [
    classes,
    audioSources,
    transcripts,
    learningJourneys,
    materials,
    references,
    flashcards,
    examOptions,
    answerKeys,
    evidenceEntries,
    evidenceLinks,
  ] = await Promise.all([
    exactCount(service, "classes", "id", [classId]),
    exactCount(service, "class_audio_sources", "class_id", [classId]),
    exactCount(service, "transcripts", "class_id", [classId]),
    exactCount(service, "topic_learning_journeys", "topic_id", topicIds),
    exactCount(service, "study_materials", "topic_id", topicIds),
    exactCount(service, "topic_references", "topic_id", topicIds),
    exactCount(service, "flashcards", "topic_id", topicIds),
    exactCount(service, "exam_options", "question_id", questionIds),
    exactCount(service, "exam_answer_keys", "question_id", questionIds),
    exactCount(service, "class_evidence", "class_id", [classId]),
    exactCount(
      service,
      "editorial_artifact_evidence",
      "artifact_id",
      artifactIds,
    ),
  ]);

  return {
    classes,
    audioSources,
    transcripts,
    topics: topicIds.length,
    learningJourneys,
    materials,
    conceptMaps: maps?.length ?? 0,
    conceptMapNodes,
    references,
    flashcards,
    exams: examIds.length,
    examQuestions: questionIds.length,
    examOptions,
    answerKeys,
    evidenceEntries,
    artifacts: artifactIds.length,
    evidenceLinks,
  };
}

async function assertRpcDenied(
  client: SupabaseClient,
  functionName: string,
  args: object,
) {
  const { error } = await rpc(client, functionName, args);
  assert.ok(error, `${functionName} debía estar denegada.`);
  assert.equal(error.code, "42501", `${functionName} no falló por privilegios.`);
}

async function verifyNoSyntheticResidue(service: SupabaseClient) {
  const checks = await Promise.all([
    service
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("curriculum_code", fixture.curriculum.code),
    service
      .from("subjects")
      .select("id", { count: "exact", head: true })
      .eq("name", fixture.subject.name),
    service
      .from("legal_references")
      .select("id", { count: "exact", head: true })
      .eq("url", syntheticReference.url)
      .eq("citation", syntheticReference.citation),
    service
      .from("class_evidence")
      .select("id", { count: "exact", head: true })
      .eq("evidence_key", fixture.evidenceRegistry[0]!.id),
  ]);
  for (const result of checks) {
    if (result.error) throw result.error;
    assert.equal(result.count, 0, "La limpieza dejó residuos sintéticos.");
  }
}

async function main() {
  const credentials = readLocalCredentials();
  // No Supabase client exists before requireLoopback has approved the URL.
  const service = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(credentials.url, credentials.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let classId: number | null = null;
  let testUserId: string | null = null;

  try {
    await verifyNoSyntheticResidue(service);

    const { data: createdUser, error: createUserError } =
      await service.auth.admin.createUser({
        email: syntheticEmail,
        password: syntheticPassword,
        email_confirm: true,
      });
    if (createUserError) throw createUserError;
    testUserId = createdUser.user.id;

    const authenticated = createClient(credentials.url, credentials.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await authenticated.auth.signInWithPassword({
      email: syntheticEmail,
      password: syntheticPassword,
    });
    if (signInError) throw signInError;

    await assertRpcDenied(anonymous, "import_class_package_v12", {
      p_package: fixture,
    });
    await assertRpcDenied(authenticated, "import_class_package_v12", {
      p_package: fixture,
    });

    const { data: importedId, error: importError } = await rpc(
      service,
      "import_class_package_v12",
      { p_package: fixture },
    );
    if (importError) throw importError;
    classId = Number(importedId);
    assert.ok(Number.isSafeInteger(classId) && classId > 0);

    await assertRpcDenied(anonymous, "export_class_package_v12", {
      p_class_id: classId,
    });
    await assertRpcDenied(authenticated, "export_class_package_v12", {
      p_class_id: classId,
    });

    const { data: exported, error: exportError } = await rpc(
      service,
      "export_class_package_v12",
      { p_class_id: classId },
    );
    if (exportError) throw exportError;

    const { data: persistedClass, error: classError } = await service
      .from("classes")
      .select("publication_status")
      .eq("id", classId)
      .single();
    if (classError) throw classError;
    const { data: persistedTopics, error: topicError } = await service
      .from("topics")
      .select("approval_status")
      .eq("class_id", classId)
      .order("position");
    if (topicError) throw topicError;

    const roundTrip = assertClassPackageRoundTrip(fixture, exported, {
      publicationStatus: String(persistedClass.publication_status),
      topicApprovalStatuses: (persistedTopics ?? []).map(({ approval_status }) =>
        String(approval_status),
      ),
    });
    const expected = countClassPackage(fixture);
    const counts = await readDatabaseCounts(service, classId);
    assert.deepEqual(counts, {
      classes: 1,
      audioSources: fixture.curriculum.audioSources.length,
      transcripts: 1,
      topics: expected.topics,
      learningJourneys: expected.learningJourneys,
      materials: expected.materials,
      conceptMaps: expected.topics,
      conceptMapNodes: expected.conceptMapNodes,
      references: expected.references,
      flashcards: expected.flashcards,
      exams: expected.topics,
      examQuestions: expected.examQuestions,
      examOptions: expected.examOptions,
      answerKeys: expected.examQuestions,
      evidenceEntries: expected.evidenceEntries,
      artifacts: expected.artifacts,
      evidenceLinks: expected.evidenceLinks,
    });

    const beforeDuplicate = await readDatabaseCounts(service, classId);
    const duplicate = await rpc(service, "import_class_package_v12", {
      p_package: fixture,
    });
    assert.equal(duplicate.error?.code, "23505");
    assert.equal(duplicate.data, null);
    assert.deepEqual(
      await readDatabaseCounts(service, classId),
      beforeDuplicate,
      "El intento duplicado dejó residuos parciales.",
    );

    console.log(
      `✓ Supabase local validó import/export 1.2: ${roundTrip.actualCounts.evidenceEntries} evidencias, ${roundTrip.actualCounts.evidenceLinks} vínculos y cero residuos duplicados.`,
    );
  } finally {
    if (classId !== null) {
      const { error } = await service.from("classes").delete().eq("id", classId);
      if (error) throw error;
    }
    const { error: referenceCleanupError } = await service
      .from("legal_references")
      .delete()
      .eq("url", syntheticReference.url)
      .eq("citation", syntheticReference.citation);
    if (referenceCleanupError) throw referenceCleanupError;
    const { error: subjectCleanupError } = await service
      .from("subjects")
      .delete()
      .eq("name", fixture.subject.name);
    if (subjectCleanupError) throw subjectCleanupError;
    if (testUserId) {
      const { error } = await service.auth.admin.deleteUser(testUserId);
      if (error) throw error;
    }
    await verifyNoSyntheticResidue(service);
  }
}

main().catch((error: unknown) => {
  const detail =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : error instanceof Error
        ? error.message
        : "error desconocido";
  console.error(
    `✗ Gate local 1.2 rechazado: ${detail}`,
  );
  process.exitCode = 1;
});
