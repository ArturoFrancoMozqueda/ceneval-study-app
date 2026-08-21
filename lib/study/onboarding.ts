export type OnboardingSessionCandidate = {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
  curriculumCode: string;
  curriculumOrder: number | null;
};

export type StudyOnboardingState =
  | { kind: "returning" }
  | { kind: "unavailable" }
  | {
      kind: "ready";
      recommended: OnboardingSessionCandidate;
      subjectChoices: OnboardingSessionCandidate[];
    };

function isUsableSession(
  session: OnboardingSessionCandidate,
): session is OnboardingSessionCandidate & { curriculumOrder: number } {
  return (
    Number.isInteger(session.id) &&
    session.id > 0 &&
    Number.isInteger(session.subjectId) &&
    session.subjectId > 0 &&
    Number.isInteger(session.curriculumOrder) &&
    (session.curriculumOrder ?? 0) > 0 &&
    /^C\d{2}$/.test(session.curriculumCode) &&
    session.subjectName.trim().length > 0 &&
    session.title.trim().length > 0
  );
}

export function deriveStudyOnboarding({
  hasActivity,
  sessions,
}: {
  hasActivity: boolean;
  sessions: OnboardingSessionCandidate[];
}): StudyOnboardingState {
  if (hasActivity) return { kind: "returning" };

  const available = sessions.filter(isUsableSession).sort((left, right) => {
    return (
      left.curriculumOrder - right.curriculumOrder ||
      left.subjectName.localeCompare(right.subjectName, "es") ||
      left.id - right.id
    );
  });

  const recommended = available[0];
  if (!recommended) return { kind: "unavailable" };

  const seenSubjects = new Set<number>();
  const subjectChoices = available.filter((session) => {
    if (seenSubjects.has(session.subjectId)) return false;
    seenSubjects.add(session.subjectId);
    return true;
  });

  return { kind: "ready", recommended, subjectChoices };
}
