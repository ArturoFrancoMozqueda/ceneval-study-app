export const requiredMaterialTypes = [
  "short_answer",
  "full_explanation",
  "legal_basis",
  "simple_example",
  "ceneval_example",
  "summary",
  "study_guide",
  "key_concepts",
  "common_errors",
] as const;

export type RequiredMaterialType = (typeof requiredMaterialTypes)[number];

export const requiredMaterialLabels: Record<RequiredMaterialType, string> = {
  short_answer: "Respuesta corta",
  full_explanation: "Explicación completa",
  legal_basis: "Fundamento jurídico",
  simple_example: "Ejemplo sencillo",
  ceneval_example: "Ejemplo tipo CENEVAL",
  summary: "Resumen",
  study_guide: "Guía de estudio",
  key_concepts: "Conceptos clave",
  common_errors: "Errores comunes",
};

export const minimumFlashcards = 10;
export const requiredExamQuestions = 10;

type ApprovedTopic = { id: number; title: string };
type TopicMaterial = { topic_id: number; material_type: string };
type TopicRelation = { topic_id: number };
type CurrentExam = {
  id: number;
  topic_id: number;
  exam_questions: { id: number }[] | null;
};

export type PublicationTopicDiagnostic = {
  topicId: number;
  topicTitle: string;
  missingMaterialTypes: RequiredMaterialType[];
  hasConceptMap: boolean;
  flashcardCount: number;
  hasCurrentExam: boolean;
  examQuestionCount: number;
};

export type PublicationReadinessFailure =
  | { reason: "no-approved-topics" }
  | {
      reason: "incomplete-topics";
      topics: PublicationTopicDiagnostic[];
    };

export function derivePublicationDiagnostics({
  topics,
  materials,
  conceptMaps,
  flashcards,
  exams,
}: {
  topics: ApprovedTopic[];
  materials: TopicMaterial[];
  conceptMaps: TopicRelation[];
  flashcards: TopicRelation[];
  exams: CurrentExam[];
}): PublicationTopicDiagnostic[] {
  const materialsByTopic = new Map<number, Set<string>>();
  const mapTopicIds = new Set(conceptMaps.map(({ topic_id }) => topic_id));
  const flashcardsByTopic = new Map<number, number>();
  const examsByTopic = new Map<number, CurrentExam>();

  for (const material of materials) {
    const types = materialsByTopic.get(material.topic_id) ?? new Set<string>();
    types.add(material.material_type);
    materialsByTopic.set(material.topic_id, types);
  }
  for (const flashcard of flashcards) {
    flashcardsByTopic.set(
      flashcard.topic_id,
      (flashcardsByTopic.get(flashcard.topic_id) ?? 0) + 1,
    );
  }
  for (const exam of exams) {
    examsByTopic.set(exam.topic_id, exam);
  }

  return topics.flatMap((topic) => {
    const materialTypes = materialsByTopic.get(topic.id) ?? new Set<string>();
    const exam = examsByTopic.get(topic.id);
    const diagnostic: PublicationTopicDiagnostic = {
      topicId: topic.id,
      topicTitle: topic.title,
      missingMaterialTypes: requiredMaterialTypes.filter(
        (type) => !materialTypes.has(type),
      ),
      hasConceptMap: mapTopicIds.has(topic.id),
      flashcardCount: flashcardsByTopic.get(topic.id) ?? 0,
      hasCurrentExam: Boolean(exam),
      examQuestionCount: exam?.exam_questions?.length ?? 0,
    };

    const complete =
      diagnostic.missingMaterialTypes.length === 0 &&
      diagnostic.hasConceptMap &&
      diagnostic.flashcardCount >= minimumFlashcards &&
      diagnostic.hasCurrentExam &&
      diagnostic.examQuestionCount === requiredExamQuestions;

    return complete ? [] : [diagnostic];
  });
}
