import { Buffer } from "node:buffer";

export const examHistoryPageSize = 12;

export type ExamAttemptRecord = {
  id: number;
  examId: number;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number | null;
};

export type ExamHistoryMetadata = {
  examId: number;
  examTitle: string;
  isCurrentExam: boolean;
  topicId: number;
  topicTitle: string;
  topicApproved: boolean;
  classId: number;
  classTitle: string;
  curriculumCode: string;
  classPublished: boolean;
};

export type ExamHistoryItem = {
  attemptRef: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  examTitle: string;
  topicTitle: string;
  classTitle: string;
  curriculumCode: string;
  status: "current" | "historical";
  topicHref: string | null;
};

export type ExamHistoryPage = {
  items: ExamHistoryItem[];
  nextCursor: string | null;
};

export type ExamAnswerRecord = {
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
};

export type ExamQuestionRecord = {
  id: number;
  examId: number;
  text: string;
  position: number;
};

export type ExamOptionRecord = {
  id: number;
  questionId: number;
  text: string;
};

export type ExamAttemptDetail = ExamHistoryItem & {
  responses: Array<{
    questionId: number;
    question: string;
    selectedOption: string;
    isCorrect: boolean;
  }>;
};

function isDatabaseId(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

function isValidAttempt(
  attempt: ExamAttemptRecord,
): attempt is ExamAttemptRecord & {
  completedAt: string;
  score: number;
  totalQuestions: number;
} {
  return (
    isDatabaseId(attempt.id) &&
    isDatabaseId(attempt.examId) &&
    typeof attempt.completedAt === "string" &&
    !Number.isNaN(Date.parse(attempt.completedAt)) &&
    Number.isInteger(attempt.score) &&
    Number.isInteger(attempt.totalQuestions) &&
    (attempt.totalQuestions ?? 0) > 0 &&
    (attempt.score ?? -1) >= 0 &&
    (attempt.score ?? 0) <= (attempt.totalQuestions ?? 0)
  );
}

function isCurrent(metadata: ExamHistoryMetadata) {
  return (
    metadata.isCurrentExam &&
    metadata.topicApproved &&
    metadata.classPublished
  );
}

export function encodeAttemptRef(attemptId: number) {
  if (!isDatabaseId(attemptId)) return null;
  return Buffer.from(`attempt-v1:${attemptId}`, "utf8").toString("base64url");
}

export function parseAttemptRef(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(value)) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const match = /^attempt-v1:([1-9]\d*)$/.exec(decoded);
    if (!match) return null;
    const attemptId = Number(match[1]);
    return isDatabaseId(attemptId) ? attemptId : null;
  } catch {
    return null;
  }
}

function deriveItem(
  attempt: ExamAttemptRecord,
  metadata: ExamHistoryMetadata | undefined,
): ExamHistoryItem | null {
  if (!isValidAttempt(attempt)) return null;
  const attemptRef = encodeAttemptRef(attempt.id);
  if (!attemptRef) return null;
  const current = metadata ? isCurrent(metadata) : false;

  return {
    attemptRef,
    completedAt: attempt.completedAt,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
    examTitle: metadata?.examTitle || "Examen histórico",
    topicTitle: metadata?.topicTitle || "Tema histórico",
    classTitle: metadata?.classTitle || "Clase histórica",
    curriculumCode: metadata?.curriculumCode || "Sin código",
    status: current ? "current" : "historical",
    topicHref: current && metadata ? `/temas/${metadata.topicId}` : null,
  };
}

export function deriveExamHistoryPage(
  attempts: ExamAttemptRecord[],
  metadataRows: ExamHistoryMetadata[],
  pageSize: number = examHistoryPageSize,
): ExamHistoryPage {
  const metadataByExam = new Map(
    metadataRows.map((metadata) => [metadata.examId, metadata]),
  );
  const validItems = attempts.flatMap((attempt) => {
    const item = deriveItem(attempt, metadataByExam.get(attempt.examId));
    return item ? [{ item, attemptId: attempt.id }] : [];
  });
  const hasMore = validItems.length > pageSize;
  const visible = validItems.slice(0, pageSize);
  const last = visible.at(-1);

  return {
    items: visible.map(({ item }) => item),
    nextCursor: hasMore && last ? encodeAttemptRef(last.attemptId) : null,
  };
}

export function deriveExamAttemptDetail(
  attempt: ExamAttemptRecord,
  metadata: ExamHistoryMetadata | undefined,
  answers: ExamAnswerRecord[],
  questions: ExamQuestionRecord[],
  selectedOptions: ExamOptionRecord[],
): ExamAttemptDetail | null {
  const item = deriveItem(attempt, metadata);
  if (!item) return null;

  const questionById = new Map(
    questions
      .filter((question) => question.examId === attempt.examId)
      .map((question) => [question.id, question]),
  );
  const optionById = new Map(selectedOptions.map((option) => [option.id, option]));
  const responses = answers.flatMap((answer) => {
    const question = questionById.get(answer.questionId);
    const option = optionById.get(answer.selectedOptionId);
    if (!question || !option || option.questionId !== question.id) return [];
    return [
      {
        questionId: question.id,
        question: question.text,
        selectedOption: option.text,
        isCorrect: answer.isCorrect,
        position: question.position,
      },
    ];
  });

  if (responses.length !== answers.length) return null;
  responses.sort((left, right) => left.position - right.position);

  return {
    ...item,
    responses: responses.map((response) => ({
      questionId: response.questionId,
      question: response.question,
      selectedOption: response.selectedOption,
      isCorrect: response.isCorrect,
    })),
  };
}
