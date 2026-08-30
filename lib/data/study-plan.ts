import "server-only";

import { getReviewOverview } from "@/lib/data/academic";
import { loadAdaptivePracticeOverview } from "@/lib/data/adaptive-practice";
import {
  deriveStudyPlanOverview,
  type StudyPlanOverview,
} from "@/lib/study/study-plan";

export async function getStudyPlanOverview(
  userId: string,
): Promise<{ overview: StudyPlanOverview; traditional: Awaited<ReturnType<typeof getReviewOverview>> }> {
  const [traditional, adaptive] = await Promise.all([
    getReviewOverview(userId),
    loadAdaptivePracticeOverview(userId),
  ]);

  return {
    overview: deriveStudyPlanOverview({
      traditionalDueCount: traditional.dueCards.length,
      traditionalDifficultCount: traditional.currentDifficultCount,
      traditionalNextReviewAt: traditional.nextReviewAt,
      adaptiveHasHistory: adaptive.hasHistory,
      adaptiveDueCount: adaptive.dueCount,
      adaptiveDifficultCount: adaptive.difficultCount,
      adaptiveNextReviewAt: adaptive.nextReviewAt,
      activeSessionRemaining: adaptive.activeSessionRemaining,
    }),
    traditional,
  };
}
