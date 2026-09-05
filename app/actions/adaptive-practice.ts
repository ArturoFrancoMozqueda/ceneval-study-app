"use server";

import { z } from "zod";
import {
  HiddenPracticeContentError,
  loadActivePracticeSession,
  toPracticeItem,
} from "@/lib/data/adaptive-practice";
import { requireUser } from "@/lib/auth";
import {
  createInitialRetrievalState,
  prioritizeDueRetrievalItems,
  retrievalConfidenceSchema,
  retrievalOutcomeSchema,
  scheduleRetrievalReview,
  type PracticeAnswerKey,
  type PracticeSession,
  type RetrievalScheduleState,
} from "@/lib/study/adaptive-practice";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import {
  applyExamTargetHeuristicV1,
  EXAM_TARGET_HEURISTIC_VERSION,
} from "@/lib/study/exam-target";

type PracticeActionResult<T> = { error: string } | T;
type RateAdaptiveAttemptResult = {
  nextReviewAt: string;
  stage: number;
  instruction: "retry_in_session" | "review_tomorrow" | "advance";
};

const startSchema = z
  .object({
    topicId: z.number().int().positive().optional(),
    targetSize: z.number().int().min(3).max(5).default(5),
  })
  .strict();
const revealSchema = z
  .object({
    itemId: z.number().int().positive(),
    confidence: retrievalConfidenceSchema,
  })
  .strict();
const rateSchema = z
  .object({
    attemptId: z.uuid(),
    outcome: retrievalOutcomeSchema,
  })
  .strict();
const atomicRateResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    nextReviewAt: z.string().datetime({ offset: true }),
    stage: z.number().int().min(0).max(5),
    instruction: z.enum(["retry_in_session", "review_tomorrow", "advance"]),
  }),
  z.object({ status: z.literal("invalid") }),
  z.object({ status: z.literal("unavailable") }),
]);
const abandonSchema = z.object({ sessionId: z.uuid() }).strict();

function unavailable(operation?: string, error?: unknown) {
  if (operation) writeDependencyFailure({ error, operation });
  return { error: "La práctica adaptativa no está disponible en este momento." };
}

function toScheduleState(row: Record<string, unknown>): RetrievalScheduleState {
  return {
    stage: Number(row.stage) as RetrievalScheduleState["stage"],
    successStreak: Number(row.success_streak),
    lapseCount: Number(row.lapse_count),
    lastConfidence: row.last_confidence as RetrievalScheduleState["lastConfidence"],
    lastOutcome: row.last_outcome as RetrievalScheduleState["lastOutcome"],
    lastReviewedAt: row.last_reviewed_at ? String(row.last_reviewed_at) : null,
    nextReviewAt: String(row.next_review_at),
    schedulerVersion: "spacing-v1",
  };
}

export async function getPracticeSessionAction(): Promise<
  PracticeActionResult<{ session: PracticeSession | null }>
> {
  const user = await requireUser();
  try {
    return { session: await loadActivePracticeSession(user.id) };
  } catch (error) {
    if (error instanceof HiddenPracticeContentError) {
      return { session: null };
    }
    return unavailable("getPracticeSession", error);
  }
}

export async function startOrResumePracticeSessionAction(
  rawInput: unknown,
): Promise<PracticeActionResult<{ session: PracticeSession }>> {
  const user = await requireUser();
  const parsed = startSchema.safeParse(rawInput);
  if (!parsed.success) return unavailable();
  let current: PracticeSession | null;
  try {
    current = await loadActivePracticeSession(user.id);
  } catch (error) {
    if (!(error instanceof HiddenPracticeContentError)) {
      return unavailable("resumePracticeSession", error);
    }
    const { error: abandonError } = await getSupabaseAdminClient()
      .from("practice_sessions")
      .update({ status: "abandoned", last_activity_at: new Date().toISOString() })
      .eq("id", error.sessionId)
      .eq("user_id", user.id)
      .eq("status", "active");
    if (abandonError) return unavailable("abandonHiddenPracticeSession", abandonError);
    current = null;
  }
  if (current) return { session: current };

  const student = await createServerSupabaseClient();
  if (parsed.data.topicId !== undefined) {
    const { data: topic, error: topicError } = await student
      .from("topics")
      .select("id,approval_status,classes!inner(publication_status)")
      .eq("id", parsed.data.topicId)
      .eq("approval_status", "approved")
      .eq("classes.publication_status", "published")
      .maybeSingle();
    if (topicError || !topic) return unavailable("loadPracticeTopic", topicError);
  }

  let itemsQuery = student
    .from("retrieval_items")
    .select(
      "id,stable_code,topic_id,prompt,retrieval_type,difficulty,estimated_seconds,objective",
    )
    .eq("editorial_status", "published")
    .order("stable_code");
  if (parsed.data.topicId !== undefined) {
    itemsQuery = itemsQuery.eq("topic_id", parsed.data.topicId);
  }
  const { data: rows, error: itemsError } = await itemsQuery;
  if (itemsError || !rows?.length) return unavailable("loadPracticeItems", itemsError);

  const items = rows.map((row) => toPracticeItem(row));
  const admin = getSupabaseAdminClient();
  const itemIds = items.map(({ id }) => id);
  const { data: stateRows, error: stateError } = await admin
    .from("retrieval_schedule_states")
    .select("retrieval_item_id,stage,success_streak,lapse_count,last_confidence,last_outcome,last_reviewed_at,next_review_at")
    .eq("user_id", user.id)
    .in("retrieval_item_id", itemIds);
  if (stateError) return unavailable("loadPracticeSchedule", stateError);
  const stateByItem = new Map(
    (stateRows ?? []).map((row) => [
      Number(row.retrieval_item_id),
      toScheduleState(row),
    ]),
  );
  const now = new Date();
  const due = prioritizeDueRetrievalItems(
    items.flatMap((item) => {
      const state = stateByItem.get(item.id);
      return state
        ? [{ id: item.id, stableCode: item.stableCode, topicId: item.topicId, state }]
        : [];
    }),
    now,
  );
  const selected = due.map(({ id, topicId }) => ({ id, topicId }));
  const unseen = items
    .filter(({ id }) => !stateByItem.has(id))
    .map(({ id, topicId }) => ({ id, topicId }));
  while (selected.length < parsed.data.targetSize && unseen.length > 0) {
    const last = selected.at(-1);
    const previous = selected.at(-2);
    const repeatedTopic = last && previous && last.topicId === previous.topicId;
    const alternateIndex = repeatedTopic
      ? unseen.findIndex(({ topicId }) => topicId !== last.topicId)
      : 0;
    selected.push(unseen.splice(alternateIndex >= 0 ? alternateIndex : 0, 1)[0]!);
  }
  const selectedIds = selected.slice(0, parsed.data.targetSize).map(({ id }) => id);
  if (!selectedIds.length) return unavailable();

  const { data: session, error: sessionError } = await admin
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      target_size: selectedIds.length,
      current_position: 1,
    })
    .select("id")
    .single();
  if (sessionError || !session) {
    try {
      const raced = await loadActivePracticeSession(user.id);
      return raced ? { session: raced } : unavailable("createPracticeSession", sessionError);
    } catch (error) {
      return unavailable("createPracticeSession", error);
    }
  }
  const { error: queueError } = await admin.from("practice_session_items").insert(
    selectedIds.map((itemId, index) => ({
      session_id: session.id,
      retrieval_item_id: itemId,
      position: index + 1,
    })),
  );
  if (queueError) {
    await admin.from("practice_sessions").delete().eq("id", session.id).eq("user_id", user.id);
    return unavailable("createPracticeQueue", queueError);
  }
  const loaded = await loadActivePracticeSession(user.id);
  return loaded ? { session: loaded } : unavailable();
}

export async function revealAdaptiveItemAction(
  rawInput: unknown,
): Promise<
  PracticeActionResult<{ attemptId: string; key: PracticeAnswerKey }>
> {
  const user = await requireUser();
  const parsed = revealSchema.safeParse(rawInput);
  if (!parsed.success) return unavailable();
  let session: PracticeSession | null;
  try {
    session = await loadActivePracticeSession(user.id);
  } catch (error) {
    return unavailable("loadPracticeReveal", error);
  }
  const currentItem = session?.items[session.currentPosition - 1];
  if (!session || currentItem?.id !== parsed.data.itemId) return unavailable();

  const student = await createServerSupabaseClient();
  const { data: visibleItem } = await student
    .from("retrieval_items")
    .select("id")
    .eq("id", parsed.data.itemId)
    .eq("editorial_status", "published")
    .maybeSingle();
  if (!visibleItem) return unavailable();

  const admin = getSupabaseAdminClient();
  const [{ data: key, error: keyError }, { data: evidence, error: evidenceError }] =
    await Promise.all([
      admin
        .from("retrieval_item_answer_keys")
        .select("required_points,acceptable_alternatives,common_errors")
        .eq("retrieval_item_id", parsed.data.itemId)
        .single(),
      admin
        .from("retrieval_item_evidence")
        .select("evidence_code,label,href,verified_on")
        .eq("retrieval_item_id", parsed.data.itemId)
        .order("id"),
    ]);
  if (keyError || evidenceError || !key || !evidence?.length) {
    return unavailable("loadRetrievalAnswerKey", keyError ?? evidenceError);
  }
  const { data: existingAttempt, error: existingError } = await admin
    .from("retrieval_attempts")
    .select("id")
    .eq("session_id", session.id)
    .eq("session_position", session.currentPosition)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return unavailable("resumeRetrievalReveal", existingError);
  const attemptResult = existingAttempt
    ? { data: existingAttempt, error: null }
    : await admin
        .from("retrieval_attempts")
        .insert({
          user_id: user.id,
          session_id: session.id,
          session_position: session.currentPosition,
          retrieval_item_id: parsed.data.itemId,
          confidence: parsed.data.confidence,
        })
        .select("id")
        .single();
  const { data: resolvedAttempt, error: attemptError } = attemptResult;
  if (attemptError || !resolvedAttempt) return unavailable("revealRetrievalItem", attemptError);
  const { error: revealStatusError } = await admin
    .from("practice_session_items")
    .update({ status: "revealed" })
    .eq("session_id", session.id)
    .eq("position", session.currentPosition);
  if (revealStatusError) return unavailable("markRetrievalReveal", revealStatusError);

  return {
    attemptId: String(resolvedAttempt.id),
    key: {
      requiredPoints: key.required_points as string[],
      acceptableAlternatives: key.acceptable_alternatives as string[],
      commonErrors: key.common_errors as string[],
      evidence: evidence.map((entry) => ({
        code: String(entry.evidence_code),
        label: String(entry.label),
        ...(entry.href ? { href: String(entry.href) } : {}),
        ...(entry.verified_on ? { verifiedOn: String(entry.verified_on) } : {}),
      })),
    },
  };
}

export async function rateAdaptiveAttemptAction(
  rawInput: unknown,
): Promise<PracticeActionResult<RateAdaptiveAttemptResult>> {
  const user = await requireUser();
  const parsed = rateSchema.safeParse(rawInput);
  if (!parsed.success) return unavailable();
  const admin = getSupabaseAdminClient();
  const { data: attempt, error } = await admin
    .from("retrieval_attempts")
    .select("id,session_id,retrieval_item_id,confidence,revealed_at,outcome")
    .eq("id", parsed.data.attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !attempt) return unavailable();
  const { data: stateRow, error: stateError } = await admin
    .from("retrieval_schedule_states")
    .select("stage,success_streak,lapse_count,last_confidence,last_outcome,last_reviewed_at,next_review_at")
    .eq("user_id", user.id)
    .eq("retrieval_item_id", attempt.retrieval_item_id)
    .maybeSingle();
  if (stateError) return unavailable();
  const reviewedAt = new Date();
  const initial = stateRow
    ? toScheduleState(stateRow)
    : createInitialRetrievalState(new Date(String(attempt.revealed_at)));
  const scheduled = scheduleRetrievalReview({
    state: initial,
    confidence: retrievalConfidenceSchema.parse(attempt.confidence),
    outcome: parsed.data.outcome,
    reviewedAt,
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("exam_target_date,exam_target_heuristic_version")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return unavailable("loadExamTargetDate", profileError);
  const adjustedSchedule = applyExamTargetHeuristicV1(
    scheduled,
    profile?.exam_target_heuristic_version === EXAM_TARGET_HEURISTIC_VERSION
      ? profile.exam_target_date
      : null,
    reviewedAt,
  );
  const { data: atomicResult, error: atomicError } = await admin.rpc(
    "rate_adaptive_attempt_v1",
    {
      p_attempt_id: attempt.id,
      p_user_id: user.id,
      p_outcome: adjustedSchedule.lastOutcome,
      p_stage: adjustedSchedule.stage,
      p_success_streak: adjustedSchedule.successStreak,
      p_lapse_count: adjustedSchedule.lapseCount,
      p_last_confidence: adjustedSchedule.lastConfidence,
      p_reviewed_at: adjustedSchedule.lastReviewedAt,
      p_next_review_at: adjustedSchedule.nextReviewAt,
      p_scheduler_version: adjustedSchedule.schedulerVersion,
    },
  );
  if (atomicError) {
    return unavailable("rateAdaptiveAttemptAtomic", atomicError);
  }
  const result = atomicRateResultSchema.safeParse(atomicResult);
  if (!result.success || result.data.status !== "success") {
    return unavailable(
      "rateAdaptiveAttemptAtomic",
      result.success ? undefined : new Error("Respuesta inesperada de la RPC adaptativa."),
    );
  }
  return {
    nextReviewAt: result.data.nextReviewAt,
    stage: result.data.stage,
    instruction: result.data.instruction,
  };
}

export async function abandonPracticeSessionAction(
  rawInput: unknown,
): Promise<PracticeActionResult<{ abandoned: true }>> {
  const user = await requireUser();
  const parsed = abandonSchema.safeParse(rawInput);
  if (!parsed.success) return unavailable();
  const { data, error } = await getSupabaseAdminClient()
    .from("practice_sessions")
    .update({ status: "abandoned", last_activity_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();
  if (error || !data) return unavailable("abandonPracticeSession", error);
  return { abandoned: true };
}
