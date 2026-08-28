import { lessonStudySteps } from "@/lib/study-action-input";

export type PublishedTopic = {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
};

export type TopicProgressRecord = {
  topicId: number;
  completedSteps: string[];
  lastActivityAt: string;
};

export type TopicQuickCheckRecord = {
  id: number;
  topicId: number;
  needsReview: boolean;
  answeredAt: string;
};

export type TopicExamAttemptRecord = {
  id: number;
  topicId: number;
  score: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
};

export type SubjectProgress = {
  subjectId: number;
  subjectName: string;
  totalTopics: number;
  startedTopics: number;
  completedTopics: number;
  pendingTopics: number;
  checkedTopics: number;
  needsReviewTopics: number;
  completedExamAttempts: number;
  correctExamAnswers: number;
  answeredExamQuestions: number;
  examAccuracyPercent: number | null;
  lastActivityAt: string | null;
};

export type SubjectProgressOverview = {
  subjects: SubjectProgress[];
  totalTopics: number;
  startedTopics: number;
  completedTopics: number;
};

function isLater(candidate: string | null, current: string | null) {
  if (!candidate) return false;
  if (!current) return true;
  return candidate > current;
}

function isCompleted(completedSteps: string[]) {
  const completed = new Set(completedSteps);
  return lessonStudySteps.every((step) => completed.has(step));
}

function isValidCompletedAttempt(attempt: TopicExamAttemptRecord) {
  return (
    attempt.completedAt !== null &&
    Number.isInteger(attempt.score) &&
    Number.isInteger(attempt.totalQuestions) &&
    (attempt.totalQuestions ?? 0) > 0 &&
    (attempt.score ?? -1) >= 0 &&
    (attempt.score ?? 0) <= (attempt.totalQuestions ?? 0)
  );
}

export function deriveSubjectProgress(
  topics: PublishedTopic[],
  progressRecords: TopicProgressRecord[],
  quickCheckRecords: TopicQuickCheckRecord[],
  examAttemptRecords: TopicExamAttemptRecord[],
): SubjectProgressOverview {
  const uniqueTopics = new Map(topics.map((topic) => [topic.id, topic]));
  const progressByTopic = new Map(
    progressRecords
      .filter((progress) => uniqueTopics.has(progress.topicId))
      .map((progress) => [progress.topicId, progress]),
  );
  const latestCheckByTopic = new Map<number, TopicQuickCheckRecord>();

  for (const check of quickCheckRecords) {
    if (!uniqueTopics.has(check.topicId)) continue;
    const current = latestCheckByTopic.get(check.topicId);
    if (
      !current ||
      check.answeredAt > current.answeredAt ||
      (check.answeredAt === current.answeredAt && check.id > current.id)
    ) {
      latestCheckByTopic.set(check.topicId, check);
    }
  }

  const attemptsByTopic = new Map<number, TopicExamAttemptRecord[]>();
  for (const attempt of examAttemptRecords) {
    if (!uniqueTopics.has(attempt.topicId) || !isValidCompletedAttempt(attempt)) {
      continue;
    }
    const attempts = attemptsByTopic.get(attempt.topicId) ?? [];
    attempts.push(attempt);
    attemptsByTopic.set(attempt.topicId, attempts);
  }

  const subjects = new Map<number, SubjectProgress>();
  for (const topic of uniqueTopics.values()) {
    const subject = subjects.get(topic.subjectId) ?? {
      subjectId: topic.subjectId,
      subjectName: topic.subjectName,
      totalTopics: 0,
      startedTopics: 0,
      completedTopics: 0,
      pendingTopics: 0,
      checkedTopics: 0,
      needsReviewTopics: 0,
      completedExamAttempts: 0,
      correctExamAnswers: 0,
      answeredExamQuestions: 0,
      examAccuracyPercent: null,
      lastActivityAt: null,
    };

    subject.totalTopics += 1;
    const progress = progressByTopic.get(topic.id);
    if (progress) {
      subject.startedTopics += 1;
      if (isCompleted(progress.completedSteps)) subject.completedTopics += 1;
      if (isLater(progress.lastActivityAt, subject.lastActivityAt)) {
        subject.lastActivityAt = progress.lastActivityAt;
      }
    }

    const latestCheck = latestCheckByTopic.get(topic.id);
    if (latestCheck) {
      subject.checkedTopics += 1;
      if (latestCheck.needsReview) subject.needsReviewTopics += 1;
      if (isLater(latestCheck.answeredAt, subject.lastActivityAt)) {
        subject.lastActivityAt = latestCheck.answeredAt;
      }
    }

    for (const attempt of attemptsByTopic.get(topic.id) ?? []) {
      subject.completedExamAttempts += 1;
      subject.correctExamAnswers += attempt.score ?? 0;
      subject.answeredExamQuestions += attempt.totalQuestions ?? 0;
      if (isLater(attempt.completedAt, subject.lastActivityAt)) {
        subject.lastActivityAt = attempt.completedAt;
      }
    }

    subjects.set(topic.subjectId, subject);
  }

  const derivedSubjects = [...subjects.values()].map((subject) => ({
    ...subject,
    pendingTopics: subject.totalTopics - subject.completedTopics,
    examAccuracyPercent: subject.answeredExamQuestions
      ? Math.round(
          (subject.correctExamAnswers / subject.answeredExamQuestions) * 100,
        )
      : null,
  }));

  derivedSubjects.sort((left, right) => {
    if (left.lastActivityAt && right.lastActivityAt) {
      const recentFirst = right.lastActivityAt.localeCompare(
        left.lastActivityAt,
      );
      if (recentFirst) return recentFirst;
    } else if (left.lastActivityAt) {
      return -1;
    } else if (right.lastActivityAt) {
      return 1;
    }
    return left.subjectName.localeCompare(right.subjectName, "es");
  });

  return {
    subjects: derivedSubjects,
    totalTopics: derivedSubjects.reduce(
      (total, subject) => total + subject.totalTopics,
      0,
    ),
    startedTopics: derivedSubjects.reduce(
      (total, subject) => total + subject.startedTopics,
      0,
    ),
    completedTopics: derivedSubjects.reduce(
      (total, subject) => total + subject.completedTopics,
      0,
    ),
  };
}
