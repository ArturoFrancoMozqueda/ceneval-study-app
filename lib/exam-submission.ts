import { z } from "zod";

const databaseIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

const examSubmissionSchema = z
  .object({
    examId: databaseIdSchema,
    answers: z.record(
      z.string().regex(/^[1-9]\d*$/),
      databaseIdSchema,
    ),
  })
  .strict();

export type ValidatedExamSubmission = z.infer<typeof examSubmissionSchema>;

export type ExamQuestionReference = {
  id: number;
};

export type ExamOptionReference = {
  id: number;
  questionId: number;
};

export type ExamAnswerKeyReference = {
  questionId: number;
  correctOptionId: number;
  explanation: unknown;
  optionExplanations: unknown;
};

export type ExamSelection = {
  questionId: number;
  selectedOptionId: number;
};

export type ExamReview = {
  questionId: number;
  correct: boolean;
  explanation: string;
  selectedOptionExplanation: string;
};

type ValidationFailure = {
  success: false;
  reason: "incomplete" | "invalid";
};

type SelectionValidation =
  | { success: true; selections: ExamSelection[] }
  | ValidationFailure;

type GradingResult =
  | { success: true; score: number; review: ExamReview[] }
  | ValidationFailure;

function isDatabaseId(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export function parseExamSubmission(
  examId: unknown,
  answers: unknown,
): ValidatedExamSubmission | null {
  const result = examSubmissionSchema.safeParse({ examId, answers });
  return result.success ? result.data : null;
}

export function validateExamSelections(
  answers: Record<string, number>,
  questions: ExamQuestionReference[],
  options: ExamOptionReference[],
): SelectionValidation {
  const questionIds = questions.map(({ id }) => id);
  const questionIdSet = new Set(questionIds);

  if (
    questionIds.length === 0 ||
    questionIdSet.size !== questionIds.length ||
    questionIds.some((id) => !isDatabaseId(id))
  ) {
    return { success: false, reason: "invalid" };
  }

  const answeredQuestionIds = Object.keys(answers).map(Number);
  if (answeredQuestionIds.some((id) => !questionIdSet.has(id))) {
    return { success: false, reason: "invalid" };
  }
  if (answeredQuestionIds.length < questionIds.length) {
    return { success: false, reason: "incomplete" };
  }
  if (answeredQuestionIds.length !== questionIds.length) {
    return { success: false, reason: "invalid" };
  }

  const optionById = new Map<number, ExamOptionReference>();
  for (const option of options) {
    if (
      !isDatabaseId(option.id) ||
      !questionIdSet.has(option.questionId) ||
      optionById.has(option.id)
    ) {
      return { success: false, reason: "invalid" };
    }
    optionById.set(option.id, option);
  }

  const selections = questionIds.map((questionId) => ({
    questionId,
    selectedOptionId: answers[String(questionId)],
  }));

  if (
    selections.some(
      ({ questionId, selectedOptionId }) =>
        optionById.get(selectedOptionId)?.questionId !== questionId,
    )
  ) {
    return { success: false, reason: "invalid" };
  }

  return { success: true, selections };
}

export function gradeExamSelections(
  selections: ExamSelection[],
  options: ExamOptionReference[],
  keys: ExamAnswerKeyReference[],
): GradingResult {
  const optionById = new Map(options.map((option) => [option.id, option]));
  const keyByQuestion = new Map(keys.map((key) => [key.questionId, key]));

  if (
    keyByQuestion.size !== selections.length ||
    selections.some(({ questionId }) => !keyByQuestion.has(questionId))
  ) {
    return { success: false, reason: "invalid" };
  }

  const review: ExamReview[] = [];
  for (const selection of selections) {
    const key = keyByQuestion.get(selection.questionId);
    if (
      !key ||
      optionById.get(selection.selectedOptionId)?.questionId !==
        selection.questionId ||
      optionById.get(key.correctOptionId)?.questionId !== selection.questionId ||
      typeof key.explanation !== "string" ||
      !key.explanation.trim() ||
      !key.optionExplanations ||
      typeof key.optionExplanations !== "object" ||
      Array.isArray(key.optionExplanations)
    ) {
      return { success: false, reason: "invalid" };
    }

    const selectedOptionExplanation = (
      key.optionExplanations as Record<string, unknown>
    )[String(selection.selectedOptionId)];
    if (
      typeof selectedOptionExplanation !== "string" ||
      !selectedOptionExplanation.trim()
    ) {
      return { success: false, reason: "invalid" };
    }

    review.push({
      questionId: selection.questionId,
      correct: selection.selectedOptionId === key.correctOptionId,
      explanation: key.explanation,
      selectedOptionExplanation,
    });
  }

  return {
    success: true,
    score: review.filter(({ correct }) => correct).length,
    review,
  };
}
