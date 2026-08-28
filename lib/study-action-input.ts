import { z } from "zod";

const databaseIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

export const studySteps = [
  "discover",
  "understand",
  "apply",
  "remember",
  "check",
] as const;

// `remember` y `check` se conservan para leer progreso histórico. Desde que
// práctica y simulacro son experiencias independientes, la lección termina al
// completar estos tres pasos editoriales.
export const lessonStudySteps = ["discover", "understand", "apply"] as const;

const studyStepSchema = z.enum(studySteps);

const flashcardReviewSchema = z
  .object({
    flashcardId: databaseIdSchema,
    rating: z.enum(["again", "hard", "good", "easy"]),
  })
  .strict();

const studyProgressSchema = z
  .object({
    topicId: databaseIdSchema,
    currentStep: studyStepSchema,
    materialIndex: z.number().int().nonnegative().max(100),
    sessionMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    completedSteps: z.array(studyStepSchema).max(studySteps.length),
  })
  .strict();

const quickCheckSchema = z
  .object({
    topicId: databaseIdSchema,
    prompt: z.string().trim().min(1).max(500),
    response: z.string().trim().min(1).max(1000),
    needsReview: z.boolean(),
  })
  .strict();

export type StudyStep = (typeof studySteps)[number];

export function parseFlashcardReview(input: unknown) {
  const result = flashcardReviewSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function parseStudyProgress(input: unknown) {
  const result = studyProgressSchema.safeParse(input);
  if (!result.success) return null;
  return {
    ...result.data,
    completedSteps: [...new Set(result.data.completedSteps)],
  };
}

export function parseQuickCheck(input: unknown) {
  const result = quickCheckSchema.safeParse(input);
  return result.success ? result.data : null;
}
