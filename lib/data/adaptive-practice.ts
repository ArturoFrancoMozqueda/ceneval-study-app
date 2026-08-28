import "server-only";

import type { PracticeItem, PracticeSession } from "@/lib/study/adaptive-practice";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

export { toPracticeItem };
