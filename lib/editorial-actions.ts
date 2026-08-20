export const topicApprovalStatuses = ["approved", "rejected"] as const;

export type TopicApprovalStatus = (typeof topicApprovalStatuses)[number];

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function isTopicApprovalStatus(
  value: unknown,
): value is TopicApprovalStatus {
  return topicApprovalStatuses.includes(value as TopicApprovalStatus);
}

export function topicMutationErrorMessage(code?: string) {
  if (code === "23505") {
    return "Otro cambio ocupó esa posición al mismo tiempo. Actualiza la página e intenta nuevamente.";
  }

  return "No pudimos guardar el cambio del tema. Actualiza la página e intenta nuevamente.";
}
