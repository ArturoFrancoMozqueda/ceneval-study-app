import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateLocalSupabaseStatus } from "./lib/local-e2e-safety";

type DatabaseError = { code?: string } | null;

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
assert.ok(Number.isSafeInteger(classId) && Number.isSafeInteger(topicId));

const service = createClient(credentials.apiUrl, credentials.secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = () =>
  createClient(credentials.apiUrl, credentials.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
let lastCheckpoint = "inicio";

async function signIn(emailName: string, passwordName: string) {
  const client = publicClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error("No se pudo iniciar una sesión local.");
  return { client, id: data.user.id };
}

function requireNoError(error: DatabaseError, context: string) {
  if (error) throw new Error(`${context} (${error.code ?? "sin-código"}).`);
}

async function callOverview(client: SupabaseClient) {
  const { data, error } = await client.rpc("get_review_overview_v1");
  requireNoError(error, "Falló get_review_overview_v1");
  assert.ok(Array.isArray(data), "El RPC debe retornar una colección de filas.");
  assert.equal(data.length, 1, "El RPC debe retornar exactamente una fila.");
  const row = data[0] as { overview?: unknown };
  assert.ok(row.overview && typeof row.overview === "object");
  return row.overview as Record<string, unknown>;
}

function assertEmptyOverview(overview: Record<string, unknown>) {
  assert.deepEqual(overview, {
    dueCards: [],
    currentDifficultCards: 0,
    currentDifficultChecks: 0,
    currentDifficultCount: 0,
    nextReviewAt: null,
  });
}

async function main() {
  const owner = await signIn("E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD");
  const other = await signIn(
    "E2E_OTHER_STUDENT_EMAIL",
    "E2E_OTHER_STUDENT_PASSWORD",
  );
  const admin = await signIn("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");
  const insertedReviewIds: number[] = [];
  const insertedCheckIds: number[] = [];

  const cardResult = await service
    .from("flashcards")
    .select("id")
    .eq("topic_id", topicId)
    .order("position")
    .limit(8);
  requireNoError(cardResult.error, "No se encontró la tarjeta sintética");
  assert.equal(cardResult.data?.length, 8);
  const flashcardId = Number(cardResult.data![0]!.id);
  const futureFlashcardIds = cardResult.data!.slice(1, 3).map((row) => Number(row.id));
  const orderedDueFlashcardIds = cardResult.data!
    .slice(3, 8)
    .map((row) => Number(row.id));
  const tieTimestamp = "2026-08-21T12:00:00.000Z";
  let expectedNextReviewAt = "";

  try {
    lastCheckpoint = "insertar historial >500";
    const reviewHistory = Array.from({ length: 501 }, (_, index) => ({
      user_id: owner.id,
      flashcard_id: flashcardId,
      rating: index % 2 === 0 ? "good" : "easy",
      reviewed_at: new Date(Date.parse(tieTimestamp) - (501 - index) * 1000).toISOString(),
      next_review_at: null,
    }));
    reviewHistory.push(
      {
        user_id: owner.id,
        flashcard_id: flashcardId,
        rating: "hard",
        reviewed_at: tieTimestamp,
        next_review_at: null,
      },
      {
        user_id: owner.id,
        flashcard_id: flashcardId,
        rating: "again",
        reviewed_at: tieTimestamp,
        next_review_at: null,
      },
    );
    const reviews = await service
      .from("flashcard_reviews")
      .insert(reviewHistory)
      .select("id");
    requireNoError(reviews.error, "No se sembró historial de tarjetas");
    insertedReviewIds.push(...(reviews.data ?? []).map((row) => Number(row.id)));

    const futureReview = await service
      .from("flashcard_reviews")
      .insert({
        user_id: owner.id,
        flashcard_id: futureFlashcardIds[0],
        rating: "hard",
        reviewed_at: tieTimestamp,
        next_review_at: "2099-01-01T00:00:00.000Z",
      })
      .select("id,next_review_at")
      .single();
    requireNoError(futureReview.error, "No se sembró la revisión futura");
    insertedReviewIds.push(Number(futureReview.data!.id));
    const orderedReviews = await service
      .from("flashcard_reviews")
      .insert([
        {
          user_id: owner.id,
          flashcard_id: futureFlashcardIds[1],
          rating: "easy",
          reviewed_at: tieTimestamp,
          next_review_at: "2098-01-01T00:00:00.000Z",
        },
        {
          user_id: owner.id,
          flashcard_id: orderedDueFlashcardIds[0],
          rating: "hard",
          reviewed_at: tieTimestamp,
          next_review_at: null,
        },
        ...orderedDueFlashcardIds.slice(1, 3).map((id) => ({
          user_id: owner.id,
          flashcard_id: id,
          rating: "hard",
          reviewed_at: tieTimestamp,
          next_review_at: "2000-01-01T00:00:00.000Z",
        })),
        {
          user_id: owner.id,
          flashcard_id: orderedDueFlashcardIds[3],
          rating: "good",
          reviewed_at: tieTimestamp,
          next_review_at: "2001-01-01T00:00:00.000Z",
        },
        {
          user_id: owner.id,
          flashcard_id: orderedDueFlashcardIds[4],
          rating: "easy",
          reviewed_at: tieTimestamp,
          next_review_at: "1999-01-01T00:00:00.000Z",
        },
      ])
      .select("id,flashcard_id,next_review_at");
    requireNoError(orderedReviews.error, "No se sembró el orden completo");
    insertedReviewIds.push(
      ...(orderedReviews.data ?? []).map((row) => Number(row.id)),
    );
    expectedNextReviewAt = String(
      orderedReviews.data?.find(
        (row) => Number(row.flashcard_id) === futureFlashcardIds[1],
      )?.next_review_at,
    );

    const checks = await service
      .from("quick_check_responses")
      .insert([
        {
          user_id: owner.id,
          topic_id: topicId,
          prompt: "Control sintético anterior",
          response: "Respuesta sintética anterior",
          needs_review: true,
          answered_at: tieTimestamp,
        },
        {
          user_id: owner.id,
          topic_id: topicId,
          prompt: "Control sintético vigente",
          response: "Respuesta sintética vigente",
          needs_review: false,
          answered_at: tieTimestamp,
        },
        {
          user_id: other.id,
          topic_id: topicId,
          prompt: "Control sintético ajeno",
          response: "Respuesta sintética ajena",
          needs_review: false,
          answered_at: tieTimestamp,
        },
      ])
      .select("id");
    requireNoError(checks.error, "No se sembraron controles rápidos");
    insertedCheckIds.push(...(checks.data ?? []).map((row) => Number(row.id)));

    lastCheckpoint = "insertar control ajeno";
    const otherReview = await service
      .from("flashcard_reviews")
      .insert({
        user_id: other.id,
        flashcard_id: flashcardId,
        rating: "easy",
        reviewed_at: tieTimestamp,
        next_review_at: null,
      })
      .select("id")
      .single();
    requireNoError(otherReview.error, "No se sembró revisión ajena");
    insertedReviewIds.push(Number(otherReview.data!.id));

    lastCheckpoint = "validar overview propio";
    const ownerOverview = await callOverview(owner.client);
    assert.deepEqual(Object.keys(ownerOverview).sort(), [
      "currentDifficultCards",
      "currentDifficultChecks",
      "currentDifficultCount",
      "dueCards",
      "nextReviewAt",
    ]);
    assert.equal(ownerOverview.currentDifficultCards, 5);
    assert.equal(ownerOverview.currentDifficultChecks, 0);
    assert.equal(ownerOverview.currentDifficultCount, 5);
    assert.equal(ownerOverview.nextReviewAt, expectedNextReviewAt);
    const dueCards = ownerOverview.dueCards as Array<Record<string, unknown>>;
    assert.equal(dueCards.length, 6, ">500 eventos no deben duplicar ni truncar tarjetas vigentes.");
    assert.equal(dueCards[0]!.rating, "again", "El id mayor debe romper el empate temporal.");
    assert.equal(dueCards[0]!.id, flashcardId);
    assert.deepEqual(
      dueCards.map((card) => card.id),
      [flashcardId, ...orderedDueFlashcardIds],
      "El orden debe ser rating, fecha de vencimiento y flashcard_id.",
    );
    assert.deepEqual(
      dueCards.map((card) => card.rating),
      ["again", "hard", "hard", "hard", "good", "easy"],
    );

    lastCheckpoint = "validar aislamiento";
    const otherOverview = await callOverview(other.client);
    assert.equal((otherOverview.dueCards as unknown[]).length, 1);
    assert.equal(otherOverview.currentDifficultCount, 0);
    assertEmptyOverview(await callOverview(admin.client));

    lastCheckpoint = "validar ACL";
    for (const client of [publicClient(), service]) {
      const denied = await client.rpc("get_review_overview_v1");
      assert.equal(denied.error?.code, "42501");
    }

    lastCheckpoint = "validar estados de tema";
    for (const approvalStatus of ["pending", "rejected"] as const) {
      const update = await service
        .from("topics")
        .update({ approval_status: approvalStatus })
        .eq("id", topicId);
      requireNoError(update.error, `No se aplicó estado ${approvalStatus}`);
      assertEmptyOverview(await callOverview(owner.client));
    }
    const restoreTopic = await service
      .from("topics")
      .update({ approval_status: "approved" })
      .eq("id", topicId);
    requireNoError(restoreTopic.error, "No se restauró el tema aprobado");

    lastCheckpoint = "validar estados de clase";
    for (const publicationStatus of ["draft", "withdrawn"] as const) {
      const update = await service
        .from("classes")
        .update({ publication_status: publicationStatus, published_at: null })
        .eq("id", classId);
      requireNoError(update.error, `No se aplicó estado ${publicationStatus}`);
      assertEmptyOverview(await callOverview(owner.client));
    }
    console.log("[OK] review overview local: own-only, latest, estados y >500 eventos.");
  } finally {
    await service.from("topics").update({ approval_status: "approved" }).eq("id", topicId);
    if (insertedCheckIds.length) {
      await service.from("quick_check_responses").delete().in("id", insertedCheckIds);
    }
    if (insertedReviewIds.length) {
      await service.from("flashcard_reviews").delete().in("id", insertedReviewIds);
    }
    const [reviewsLeft, checksLeft] = await Promise.all([
      service.from("flashcard_reviews").select("id", { count: "exact", head: true }).in("id", insertedReviewIds.length ? insertedReviewIds : [-1]),
      service.from("quick_check_responses").select("id", { count: "exact", head: true }).in("id", insertedCheckIds.length ? insertedCheckIds : [-1]),
    ]);
    requireNoError(reviewsLeft.error, "No se verificó cleanup de revisiones");
    requireNoError(checksLeft.error, "No se verificó cleanup de controles");
    assert.equal(reviewsLeft.count, 0);
    assert.equal(checksLeft.count, 0);
    console.log("[OK] cleanup propio review overview = 0.");
  }
}

main().catch((error: unknown) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  console.error(
    `[FAIL] review overview local checkpoint=${lastCheckpoint}${/^[A-Z0-9]{1,10}$/.test(code) ? ` [${code}]` : ""}.`,
  );
  process.exitCode = 1;
});
