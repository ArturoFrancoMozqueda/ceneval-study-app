import "server-only";

import type { PracticeItem, PracticeSession } from "@/lib/study/adaptive-practice";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdaptivePracticeOverview = {
  hasHistory: boolean;
  dueCount: number;
  difficultCount: number;
  nextReviewAt: string | null;
  activeSessionRemaining: number;
};

export class HiddenPracticeContentError extends Error {
  constructor(readonly sessionId: string) {
    super("La sesión contiene práctica retirada o no aprobada.");
  }
}

function toPracticeItem(row: Record<string, unknown>): PracticeItem {
  return {
    id: Number(row.id),
    stableCode: String(row.stable_code),
    topicId: Number(row.topic_id),
    prompt: String(row.prompt),
    retrievalType: row.retrieval_type as PracticeItem["retrievalType"],
    difficulty: row.difficulty as PracticeItem["difficulty"],
    estimatedSeconds: Number(row.estimated_seconds),
    objective: String(row.objective),
  };
}

export async function loadActivePracticeSession(
  userId: string,
): Promise<PracticeSession | null> {
  const admin = getSupabaseAdminClient();
  const { data: session, error } = await admin
    .from("practice_sessions")
    .select("id,status,target_size,current_position")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error("No se pudo recuperar la sesión adaptativa.");
  if (!session) return null;

  const { data: sessionItems, error: itemsError } = await admin
    .from("practice_session_items")
    .select("position,retrieval_item_id")
    .eq("session_id", session.id)
    .order("position");
  if (itemsError) throw new Error("No se pudo recuperar la cola adaptativa.");
  const itemIds = (sessionItems ?? []).map((row) => Number(row.retrieval_item_id));
  const uniqueItemIds = [...new Set(itemIds)];
  const { data: items, error: contentError } = uniqueItemIds.length
    ? await admin
        .from("retrieval_items")
        .select(
          "id,stable_code,topic_id,prompt,retrieval_type,difficulty,estimated_seconds,objective",
        )
        .in("id", uniqueItemIds)
        .eq("editorial_status", "published")
    : { data: [], error: null };
  if (contentError) throw new Error("No se pudo recuperar el contenido adaptativo.");
  const topicIds = [...new Set((items ?? []).map((row) => Number(row.topic_id)))];
  const { data: visibleTopics, error: topicsError } = topicIds.length
    ? await admin
        .from("topics")
        .select("id,approval_status,classes!inner(publication_status)")
        .in("id", topicIds)
        .eq("approval_status", "approved")
        .eq("classes.publication_status", "published")
    : { data: [], error: null };
  if (topicsError) throw new Error("No se pudo verificar la publicación de la práctica.");
  const visibleTopicIds = new Set((visibleTopics ?? []).map((row) => Number(row.id)));
  const visibleItems = (items ?? []).filter((row) =>
    visibleTopicIds.has(Number(row.topic_id)),
  );
  if (visibleItems.length !== uniqueItemIds.length) {
    throw new HiddenPracticeContentError(String(session.id));
  }
  const byId = new Map(
    visibleItems.map((row) => [Number(row.id), toPracticeItem(row)]),
  );

  return {
    id: String(session.id),
    status: session.status as PracticeSession["status"],
    targetSize: Number(session.target_size),
    currentPosition: Number(session.current_position),
    items: (sessionItems ?? []).flatMap((row) => {
      const item = byId.get(Number(row.retrieval_item_id));
      return item ? [item] : [];
    }),
  };
}

export async function loadAdaptivePracticeOverview(
  userId: string,
): Promise<AdaptivePracticeOverview> {
  const admin = getSupabaseAdminClient();
  const [{ data: stateRows, error: stateError }, activeSession] = await Promise.all([
    admin
      .from("retrieval_schedule_states")
      .select("retrieval_item_id,last_confidence,last_outcome,next_review_at")
      .eq("user_id", userId),
    loadActivePracticeSession(userId).catch((error) => {
      if (error instanceof HiddenPracticeContentError) return null;
      throw error;
    }),
  ]);
  if (stateError) throw new Error("No se pudo resumir el calendario adaptativo.");

  const itemIds = (stateRows ?? []).map((row) => Number(row.retrieval_item_id));
  const student = await createServerSupabaseClient();
  const { data: visibleItems, error: visibilityError } = itemIds.length
    ? await student
        .from("retrieval_items")
        .select("id,topics!inner(approval_status,classes!inner(publication_status))")
        .in("id", itemIds)
        .eq("editorial_status", "published")
        .eq("topics.approval_status", "approved")
        .eq("topics.classes.publication_status", "published")
    : { data: [], error: null };
  if (visibilityError) {
    throw new Error("No se pudo verificar el calendario adaptativo visible.");
  }

  const visibleIds = new Set((visibleItems ?? []).map((row) => Number(row.id)));
  const visibleStates = (stateRows ?? []).filter((row) =>
    visibleIds.has(Number(row.retrieval_item_id)),
  );
  const now = Date.now();
  const futureReviews = visibleStates
    .map((row) => String(row.next_review_at))
    .filter((value) => Date.parse(value) > now)
    .sort((left, right) => Date.parse(left) - Date.parse(right));

  return {
    hasHistory: visibleStates.length > 0,
    dueCount: visibleStates.filter(
      (row) => Date.parse(String(row.next_review_at)) <= now,
    ).length,
    difficultCount: visibleStates.filter(
      (row) =>
        row.last_outcome === "incorrect" ||
        row.last_outcome === "partial" ||
        row.last_confidence === "no_recall" ||
        row.last_confidence === "unsure",
    ).length,
    nextReviewAt: futureReviews[0] ?? null,
    activeSessionRemaining: activeSession
      ? Math.max(0, activeSession.items.length - activeSession.currentPosition + 1)
      : 0,
  };
}

export { toPracticeItem };
