import type { ExamReview } from "@/lib/exam-submission";

export type ExamRunResult = {
  score: number;
  total: number;
  review: ExamReview[];
};

export type ExamRunState = {
  answers: Record<string, number>;
  error: string;
  phase: "answering" | "submitting" | "reviewing";
  questionIndex: number;
  result: ExamRunResult | null;
  runNumber: number;
};

export function createExamRunState(runNumber = 0): ExamRunState {
  return {
    answers: {},
    error: "",
    phase: "answering",
    questionIndex: 0,
    result: null,
    runNumber,
  };
}

export function restartExamRun(state: ExamRunState): ExamRunState {
  return createExamRunState(state.runNumber + 1);
}

export function canSubmitExamRun(
  state: ExamRunState,
  totalQuestions: number,
) {
  return (
    state.phase === "answering" &&
    totalQuestions > 0 &&
    Object.keys(state.answers).length === totalQuestions
  );
}
