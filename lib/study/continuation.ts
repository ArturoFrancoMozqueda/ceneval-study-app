export type CurrentStudyTopic = {
  id: number;
  classId: number;
  position: number;
  curriculumOrder: number;
  curriculumCode: string;
};

export type TopicSequenceCandidate = {
  id: number;
  classId: number;
  title: string;
  position: number;
  approved: boolean;
};

export type ClassSequenceCandidate = {
  id: number;
  title: string;
  curriculumOrder: number;
  curriculumCode: string;
  published: boolean;
};

export type StudyContinuation =
  | {
      kind: "topic";
      topicId: number;
      topicTitle: string;
      curriculumCode: string;
    }
  | {
      kind: "class";
      classId: number;
      classTitle: string;
      curriculumCode: string;
    }
  | { kind: "journey-complete" }
  | { kind: "unavailable" };

function positiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function deriveStudyContinuation({
  current,
  topics,
  classes,
}: {
  current: CurrentStudyTopic;
  topics: TopicSequenceCandidate[];
  classes: ClassSequenceCandidate[];
}): StudyContinuation {
  const nextTopic = topics
    .filter(
      (topic) =>
        topic.approved &&
        positiveInteger(topic.id) &&
        topic.classId === current.classId &&
        topic.position > current.position,
    )
    .sort((left, right) => left.position - right.position)[0];

  if (nextTopic) {
    return {
      kind: "topic",
      topicId: nextTopic.id,
      topicTitle: nextTopic.title,
      curriculumCode: current.curriculumCode,
    };
  }

  const nextClass = classes
    .filter(
      (studyClass) =>
        studyClass.published &&
        positiveInteger(studyClass.id) &&
        studyClass.curriculumOrder > current.curriculumOrder &&
        /^C\d{2}$/.test(studyClass.curriculumCode),
    )
    .sort((left, right) => left.curriculumOrder - right.curriculumOrder)[0];

  if (nextClass) {
    return {
      kind: "class",
      classId: nextClass.id,
      classTitle: nextClass.title,
      curriculumCode: nextClass.curriculumCode,
    };
  }

  return { kind: "journey-complete" };
}
