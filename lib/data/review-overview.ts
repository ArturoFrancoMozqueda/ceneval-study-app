import { z } from "zod";

const isoTimestampSchema = z.string().datetime({ offset: true });

const reviewFlashcardSchema = z
  .object({
    id: z.number().int().positive(),
    question: z.string(),
    answer: z.string(),
    position: z.number().int().nonnegative(),
    topicId: z.number().int().positive(),
    topicTitle: z.string(),
    classId: z.number().int().positive(),
    classTitle: z.string(),
    curriculumCode: z.string(),
    rating: z.enum(["again", "hard", "good", "easy"]),
    nextReviewAt: isoTimestampSchema.nullable(),
  })
  .strict();

const reviewOverviewSchema = z
  .object({
    dueCards: z.array(reviewFlashcardSchema),
    currentDifficultCards: z.number().int().nonnegative(),
    currentDifficultChecks: z.number().int().nonnegative(),
    currentDifficultCount: z.number().int().nonnegative(),
    nextReviewAt: isoTimestampSchema.nullable(),
  })
  .strict()
  .superRefine((overview, context) => {
    if (
      overview.currentDifficultCount !==
      overview.currentDifficultCards + overview.currentDifficultChecks
    ) {
      context.addIssue({
        code: "custom",
        message: "El total dificil no coincide con sus componentes.",
        path: ["currentDifficultCount"],
      });
    }
  });

const reviewOverviewRowSchema = z
  .object({ overview: reviewOverviewSchema })
  .strict();

export type ReviewOverviewPayload = z.infer<typeof reviewOverviewSchema>;

export function parseReviewOverview(input: unknown): ReviewOverviewPayload {
  return reviewOverviewSchema.parse(input);
}

export function parseReviewOverviewRow(input: unknown): ReviewOverviewPayload {
  return reviewOverviewRowSchema.parse(input).overview;
}
