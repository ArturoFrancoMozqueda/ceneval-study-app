export type ProgressSaveState = "idle" | "saving" | "saved" | "error";

export function getTopicJourneyStatus(completedStepCount: number) {
  if (completedStepCount >= 3) return "Recorrido completado";
  if (completedStepCount > 0) return "En curso";
  return "Por comenzar";
}

export function getProgressSaveFeedback(state: ProgressSaveState) {
  switch (state) {
    case "saving":
      return "Guardando avance…";
    case "saved":
      return "Avance guardado";
    case "error":
      return "No se guardó este cambio. Intenta nuevamente.";
    default:
      return "Tus cambios se guardan al avanzar.";
  }
}
