import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateLocalSupabaseStatus } from "./lib/local-e2e-safety";

type QueryError = { code?: string; message?: string } | null;

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
const classId = Number(required("E2E_CLASS_ID"));
const topicId = Number(required("E2E_TOPIC_ID"));
if (!Number.isSafeInteger(classId) || !Number.isSafeInteger(topicId)) {
  throw new Error("Los identificadores E2E locales no son válidos.");
}

const service = createClient(credentials.apiUrl, credentials.secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = () =>
  createClient(credentials.apiUrl, credentials.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

let passed = 0;
let lastCheckpoint = "inicio";

function checkpoint(name: string) {
  lastCheckpoint = name;
  console.log(`[RLS] ${name}`);
}

function check(name: string, condition: boolean) {
  if (!condition) throw new Error(`Falló: ${name}.`);
  passed += 1;
  console.log(`  [OK] ${name}`);
}

function requireNoError(error: QueryError, context: string) {
  if (error) {
    const code = typeof error.code === "string" ? error.code : "sin-código";
    throw new Error(`${context} (${code}).`);
  }
}

async function signIn(emailName: string, passwordName: string) {
  const client = publicClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error("No se pudo iniciar una sesión RLS local.");
  return { client, id: data.user.id };
}

async function countRows(
  client: SupabaseClient,
  table: string,
  column: string,
  value: number | number[],
) {
  let query = client.from(table).select("*");
  query = Array.isArray(value)
    ? query.in(column, value)
    : query.eq(column, value);
  const { data, error } = await query;
  return { count: data?.length ?? 0, error };
}

async function expectVisible(
  client: SupabaseClient,
  table: string,
  column: string,
  value: number | number[],
) {
  const result = await countRows(client, table, column, value);
  requireNoError(result.error, `No se pudo consultar ${table}`);
  check(`${table} visible`, result.count > 0);
}

async function expectHidden(
  client: SupabaseClient,
  table: string,
  column: string,
  value: number | number[],
) {
  const result = await countRows(client, table, column, value);
  check(`${table} oculto`, Boolean(result.error) || result.count === 0);
}

async function expectRpcDenied(
  client: SupabaseClient,
  name: "import_class_package_v12" | "export_class_package_v12",
) {
  const args =
    name === "import_class_package_v12"
      ? { p_package: { packageVersion: "1.2" } }
      : { p_class_id: classId };
  const { error } = await client.rpc(name, args);
  check(`${name} denegada`, error?.code === "42501");
}

async function readResourceIds() {
  const topicQuery = await service
    .from("topics")
    .select("id,approval_status")
    .eq("id", topicId)
    .eq("class_id", classId)
    .single();
  requireNoError(topicQuery.error, "No se encontró el tema sintético");

  const [references, exams, artifacts] = await Promise.all([
    service.from("topic_references").select("reference_id").eq("topic_id", topicId),
    service.from("exams").select("id").eq("topic_id", topicId),
    service.from("editorial_artifacts").select("id").eq("class_id", classId),
  ]);
  requireNoError(references.error, "No se leyeron referencias");
  requireNoError(exams.error, "No se leyeron exámenes");
  requireNoError(artifacts.error, "No se leyeron artefactos");
  const referenceIds = (references.data ?? []).map((row) => Number(row.reference_id));
  const examIds = (exams.data ?? []).map((row) => Number(row.id));
  const artifactIds = (artifacts.data ?? []).map((row) => Number(row.id));

  const questions = await service
    .from("exam_questions")
    .select("id")
    .in("exam_id", examIds);
  requireNoError(questions.error, "No se leyeron preguntas");
  const questionIds = (questions.data ?? []).map((row) => Number(row.id));
  const options = await service
    .from("exam_options")
    .select("id")
    .in("question_id", questionIds);
  requireNoError(options.error, "No se leyeron opciones");
  const optionIds = (options.data ?? []).map((row) => Number(row.id));
  check("fixture relacional completo", referenceIds.length > 0 && examIds.length > 0 && artifactIds.length > 0 && questionIds.length > 0 && optionIds.length > 0);
  return { artifactIds, examIds, optionIds, questionIds, referenceIds };
}

async function assertStudyResources(
  client: SupabaseClient,
  ids: Awaited<ReturnType<typeof readResourceIds>>,
  visibility: "visible" | "hidden",
) {
  const expectation = visibility === "visible" ? expectVisible : expectHidden;
  const resources: Array<[string, string, number | number[]]> = [
    ["topics", "id", topicId],
    ["study_materials", "topic_id", topicId],
    ["concept_maps", "topic_id", topicId],
    ["topic_references", "topic_id", topicId],
    ["legal_references", "id", ids.referenceIds],
    ["flashcards", "topic_id", topicId],
    ["exams", "id", ids.examIds],
    ["exam_questions", "id", ids.questionIds],
    ["exam_options", "id", ids.optionIds],
    ["class_evidence", "class_id", classId],
    ["topic_learning_journeys", "topic_id", topicId],
    ["editorial_artifacts", "class_id", classId],
    ["editorial_artifact_evidence", "artifact_id", ids.artifactIds],
  ];
  for (const [table, column, value] of resources) {
    await expectation(client, table, column, value);
  }
}

async function testActivityOwnership(
  owner: { client: SupabaseClient; id: string },
  other: { client: SupabaseClient; id: string },
) {
  checkpoint("ownership de actividad");
  const flashcard = await service
    .from("flashcards")
    .select("id")
    .eq("topic_id", topicId)
    .limit(1)
    .single();
  requireNoError(flashcard.error, "No se encontró flashcard");
  const flashcardId = Number(flashcard.data!.id);

  const ownerProgress = await owner.client.from("study_progress").insert({
    user_id: owner.id,
    topic_id: topicId,
    current_step: "discover",
    material_index: 0,
    session_minutes: 5,
    completed_steps: [],
  });
  requireNoError(ownerProgress.error, "No se insertó progreso propio");
  const otherProgress = await other.client.from("study_progress").insert({
    user_id: other.id,
    topic_id: topicId,
    current_step: "understand",
    material_index: 0,
    session_minutes: 10,
    completed_steps: ["discover"],
  });
  requireNoError(otherProgress.error, "No se insertó progreso de control");
  const visibleProgress = await owner.client.from("study_progress").select("user_id");
  requireNoError(visibleProgress.error, "No se leyó progreso propio");
  check(
    "progreso aislado por propietaria",
    visibleProgress.data!.length === 1 && visibleProgress.data![0]!.user_id === owner.id,
  );
  const foreignProgress = await owner.client.from("study_progress").insert({
    user_id: other.id,
    topic_id: topicId,
    current_step: "check",
    material_index: 0,
    session_minutes: 1,
    completed_steps: [],
  });
  check("progreso ajeno denegado", Boolean(foreignProgress.error));

  for (const actor of [owner, other]) {
    const response = await actor.client.from("quick_check_responses").insert({
      user_id: actor.id,
      topic_id: topicId,
      prompt: `Prompt RLS sintético ${actor.id.slice(0, 4)}`,
      response: "Respuesta sintética.",
      needs_review: false,
    });
    requireNoError(response.error, "No se insertó quick check propio");
    const review = await actor.client.from("flashcard_reviews").insert({
      user_id: actor.id,
      flashcard_id: flashcardId,
      rating: "good",
    });
    requireNoError(review.error, "No se insertó repaso propio");
  }
  const ownerResponses = await owner.client.from("quick_check_responses").select("user_id");
  requireNoError(ownerResponses.error, "No se leyeron quick checks");
  check("quick checks aislados", ownerResponses.data!.every((row) => row.user_id === owner.id));
  const ownerReviews = await owner.client.from("flashcard_reviews").select("user_id");
  requireNoError(ownerReviews.error, "No se leyeron repasos");
  check("revisiones aisladas", ownerReviews.data!.every((row) => row.user_id === owner.id));

  const foreignResponse = await owner.client.from("quick_check_responses").insert({
    user_id: other.id,
    topic_id: topicId,
    prompt: "Prompt ajeno sintético",
    response: "No debe guardarse.",
    needs_review: false,
  });
  check("quick check ajeno denegado", Boolean(foreignResponse.error));
  const foreignReview = await owner.client.from("flashcard_reviews").insert({
    user_id: other.id,
    flashcard_id: flashcardId,
    rating: "easy",
  });
  check("revisión ajena denegada", Boolean(foreignReview.error));
  return flashcardId;
}

async function main() {
  const anonymous = publicClient();
  const owner = await signIn("E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD");
  const other = await signIn("E2E_OTHER_STUDENT_EMAIL", "E2E_OTHER_STUDENT_PASSWORD");
  const admin = await signIn("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");
  const ids = await readResourceIds();

  checkpoint("anon y RPC privadas");
  await expectHidden(anonymous, "classes", "id", classId);
  await assertStudyResources(anonymous, ids, "hidden");
  for (const client of [anonymous, owner.client, other.client]) {
    await expectRpcDenied(client, "import_class_package_v12");
    await expectRpcDenied(client, "export_class_package_v12");
  }

  checkpoint("publicado y aprobado");
  await expectVisible(owner.client, "classes", "id", classId);
  await assertStudyResources(owner.client, ids, "visible");
  await assertStudyResources(other.client, ids, "visible");
  const answerKeys = await countRows(owner.client, "exam_answer_keys", "question_id", ids.questionIds);
  check("exam_answer_keys bloqueada", Boolean(answerKeys.error) || answerKeys.count === 0);
  const flashcardId = await testActivityOwnership(owner, other);

  for (const status of ["pending", "rejected"] as const) {
    checkpoint(`tema ${status}`);
    const update = await service
      .from("topics")
      .update({ approval_status: status })
      .eq("id", topicId);
    requireNoError(update.error, `No se cambió el tema a ${status}`);
    await assertStudyResources(owner.client, ids, "hidden");
    await assertStudyResources(other.client, ids, "hidden");
    await assertStudyResources(admin.client, ids, "visible");

    const blockedProgress = await owner.client
      .from("study_progress")
      .update({ material_index: status === "pending" ? 2 : 3 })
      .eq("user_id", owner.id)
      .eq("topic_id", topicId)
      .select("material_index");
    check(
      `progreso bloqueado en ${status}`,
      Boolean(blockedProgress.error) || blockedProgress.data?.length === 0,
    );
    const blockedQuickCheck = await owner.client
      .from("quick_check_responses")
      .insert({
        user_id: owner.id,
        topic_id: topicId,
        prompt: `Prompt bloqueado ${status}`,
        response: "No debe persistir.",
        needs_review: false,
      });
    check(`quick check bloqueado en ${status}`, Boolean(blockedQuickCheck.error));
    const blockedReview = await owner.client.from("flashcard_reviews").insert({
      user_id: owner.id,
      flashcard_id: flashcardId,
      rating: "again",
    });
    check(`revisión bloqueada en ${status}`, Boolean(blockedReview.error));
  }

  checkpoint("perfiles");
  const profiles = await owner.client.from("profiles").select("id,role");
  requireNoError(profiles.error, "No se consultó perfil propio");
  check("perfil aislado", profiles.data!.length === 1 && profiles.data![0]!.id === owner.id);
  const foreignProfileUpdate = await owner.client
    .from("profiles")
    .update({ full_name: "No permitido" })
    .eq("id", other.id)
    .select("id");
  check("perfil ajeno no modificable", Boolean(foreignProfileUpdate.error) || foreignProfileUpdate.data?.length === 0);

  console.log(`\n[OK] ${passed} comprobaciones RLS locales completadas.`);
}

function safeDiagnostic(error: unknown) {
  let message: string | null = null;
  let code: string | null = null;
  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") message = record.message;
    if (typeof record.code === "string" && /^[A-Z0-9]{1,10}$/.test(record.code)) {
      code = record.code;
    }
  }
  if (!message && !code) return "Error desconocido";
  const safe = (message ?? "Error de base de datos")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[dato]")
    .replace(/[\w.+-]+@[\w.-]+/g, "[correo]");
  return `${code ? `[${code}] ` : ""}${safe || "Error desconocido"}`;
}

main().catch((error: unknown) => {
  console.error(`\n[FAIL] checkpoint=${lastCheckpoint}: ${safeDiagnostic(error)}`);
  process.exitCode = 1;
});
