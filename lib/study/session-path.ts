export type SessionPathCandidate = {
  id: number;
  examCompleted: boolean;
};

export type SessionPathStatus = "completed" | "current" | "upcoming";

export type SessionPathItem<T extends SessionPathCandidate> = T & {
  pathStatus: SessionPathStatus;
};

export function deriveSessionPath<T extends SessionPathCandidate>(
  sessions: T[],
): SessionPathItem<T>[] {
  const currentIndex = sessions.findIndex((session) => !session.examCompleted);

  return sessions.map((session, index) => ({
    ...session,
    pathStatus: session.examCompleted
      ? "completed"
      : currentIndex === -1 || index !== currentIndex
        ? "upcoming"
        : "current",
  }));
}

