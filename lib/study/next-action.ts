import type { StudyPlanOverview } from "./study-plan";

type NextActionInput = {
  plan: StudyPlanOverview;
  topic: { id: number; title: string } | null;
  completedSteps: number;
  session?: {
    id: number;
    curriculumCode: string;
    title: string;
    completedSteps: number;
    totalSteps: number;
  };
};

export function deriveNextStudyAction({ plan, topic, completedSteps, session }: NextActionInput) {
  if (plan.source === "active") {
    return {
      href: "/estudiar/repaso",
      title: "Retoma tu ronda pendiente",
      description: `Te quedan ${plan.recommendedCount} preguntas en la ronda que empezaste.`,
      label: "Continuar práctica",
    };
  }
  if (topic && completedSteps < 3) {
    return {
      href: `/temas/${topic.id}?modo=leccion`,
      title: `Continúa: ${topic.title}`,
      description: "Vuelve al último paso guardado de tu lección.",
      label: "Continuar lección",
    };
  }
  if (plan.recommendedCount > 0) {
    return {
      href: "/estudiar/repaso",
      title: "Recupera lo aprendido",
      description: `Tienes ${plan.recommendedCount} preguntas recomendadas para repasar hoy.`,
      label: "Repasar ahora",
    };
  }
  if (session) {
    return {
      href: `/clases/${session.id}`,
      title: `${session.curriculumCode} · ${session.title}`,
      description: session.totalSteps > 0 && session.completedSteps >= session.totalSteps
        ? "Ya recorriste la lección; su examen es el siguiente paso para acreditar la sesión."
        : "Es la primera sesión pendiente en tu ruta curricular.",
      label: "Seguir mi ruta",
    };
  }
  return {
    href: "/estudiar",
    title: "Elige tu siguiente práctica",
    description: "Consulta tus repasos o elige un tema de la biblioteca.",
    label: "Ir a practicar",
  };
}
