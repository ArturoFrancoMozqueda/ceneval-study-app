import "server-only";

import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getLatestFlashcardReviews,
  getLatestQuickChecks,
  summarizeFlashcardReviews,
  type FlashcardRating,
  type FlashcardReviewRecord,
  type QuickCheckRecord,
} from "@/lib/study/review-schedule";

export type PublicationStatus =
  | "draft"
  | "review"
  | "published"
  | "withdrawn";
export type SourceOrigin = "class" | "complementary" | "mixed";

export type Subject = {
  id: number;
  name: string;
  description: string;
  classCount: number;
  topicCount: number;
};

export type StudyClass = {
  id: number;
  subjectId: number;
  title: string;
  classDate: string;
  teacher: string;
  description: string;
  topicCount: number;
  hasTranscript: boolean;
  publicationStatus: PublicationStatus;
  publishedAt: string;
  curriculumCode: string;
  curriculumOrder: number | null;
  audioSources: AudioSource[];
};

export type AudioSource = {
  audioNumber: number;
  fragment: string;
  position: number;
};

export type StudySession = StudyClass & {
  subjectName: string;
  completedSteps: number;
  totalSteps: number;
};

export type Transcript = {
  id: number;
  classId: number;
  originalText: string;
  cleanedText: string;
  status: "pending" | "processing" | "ready" | "failed";
};

export type Topic = {
  id: number;
  classId: number;
  title: string;
  description: string;
  sourceType: "manual" | "generated";
  approvalStatus: "pending" | "approved" | "rejected";
  position: number;
};

export type StudyMaterial = {
  id: number;
  materialType:
    | "short_answer"
    | "full_explanation"
    | "legal_basis"
    | "simple_example"
    | "ceneval_example"
    | "summary"
    | "study_guide"
    | "key_concepts"
    | "common_errors";
  title: string;
  content: string;
  sourceOrigin: SourceOrigin;
  version: number;
};

export type ConceptMapNode = {
  id: string;
  label: string;
  description?: string;
  parentId?: string;
};

export type LegalReference = {
  id: number;
  title: string;
  url: string;
  institution: string;
  jurisdiction: string;
  citation: string;
  retrievedOn: string;
  note: string;
};

export type Flashcard = {
  id: number;
  question: string;
  answer: string;
  position: number;
};

export type ReviewFlashcard = Flashcard & {
  topicId: number;
  topicTitle: string;
  classId: number;
  classTitle: string;
  curriculumCode: string;
  rating: FlashcardRating;
  nextReviewAt: string | null;
};

export type ReviewOverview = {
  dueCards: ReviewFlashcard[];
  currentDifficultCards: number;
  currentDifficultChecks: number;
  currentDifficultCount: number;
  nextReviewAt: string | null;
};

export type ExamOption = {
  id: number;
  text: string;
  position: number;
};

export type ExamQuestion = {
  id: number;
  text: string;
  difficulty: "basic" | "intermediate" | "advanced";
  position: number;
  options: ExamOption[];
};

export type Exam = {
  id: number;
  title: string;
  description: string;
  questions: ExamQuestion[];
};

export type LessonBundle = {
  topic: Topic;
  studyClass: StudyClass;
  subject: Subject;
  transcript: Transcript | null;
  materials: StudyMaterial[];
  conceptMap: {
    title: string;
    description: string;
    nodes: ConceptMapNode[];
  } | null;
  references: LegalReference[];
  flashcards: Flashcard[];
  exam: Exam | null;
};

export type StudyProgress = {
  currentStep: "discover" | "understand" | "apply" | "remember" | "check";
  materialIndex: number;
  sessionMinutes: 5 | 10 | 15;
  completedSteps: StudyProgress["currentStep"][];
  lastActivityAt: string;
};

type SubjectRow = {
  id: number;
  name: string;
  description: string | null;
};

type ClassRow = {
  id: number;
  subject_id: number;
  title: string;
  class_date: string | null;
  teacher: string | null;
  description: string | null;
  publication_status: PublicationStatus;
  published_at: string | null;
  curriculum_code?: string | null;
  curriculum_order?: number | null;
  class_audio_sources?: Array<{
    audio_number: number;
    fragment: string | null;
    position: number;
  }> | null;
};

function fail(operation: string, message: string): never {
  console.error(`[Supabase] ${operation}: ${message}`);
  throw new Error("No pudimos consultar los datos. Intenta nuevamente.");
}

function toClass(
  row: ClassRow,
  topicCount: number,
  hasTranscript: boolean,
): StudyClass {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    classDate: row.class_date ?? "",
    teacher: row.teacher ?? "",
    description: row.description ?? "",
    topicCount,
    hasTranscript,
    publicationStatus: row.publication_status,
    publishedAt: row.published_at ?? "",
    curriculumCode: row.curriculum_code ?? "",
    curriculumOrder: row.curriculum_order ?? null,
    audioSources: (row.class_audio_sources ?? []).map((source) => ({
      audioNumber: source.audio_number,
      fragment: source.fragment ?? "",
      position: source.position,
    })),
  };
}

const classSelection =
  "id,subject_id,title,class_date,teacher,description,publication_status,published_at,curriculum_code,curriculum_order,class_audio_sources(audio_number,fragment,position)";

export async function getSubjects(): Promise<Subject[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [subjectsResult, classesResult, topicsResult] = await Promise.all([
    supabase
      .from("subjects")
      .select("id,name,description")
      .order("name", { ascending: true }),
    supabase.from("classes").select("id,subject_id"),
    supabase.from("topics").select("class_id"),
  ]);

  if (subjectsResult.error) fail("getSubjects", subjectsResult.error.message);
  if (classesResult.error) {
    fail("getSubjects classes", classesResult.error.message);
  }
  if (topicsResult.error) fail("getSubjects topics", topicsResult.error.message);

  const classes = (classesResult.data ?? []) as {
    id: number;
    subject_id: number;
  }[];
  const topics = (topicsResult.data ?? []) as { class_id: number }[];

  return ((subjectsResult.data ?? []) as SubjectRow[]).map((subject) => {
    const subjectClasses = classes.filter(
      (studyClass) => studyClass.subject_id === subject.id,
    );
    const classIds = new Set(subjectClasses.map(({ id }) => id));
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description ?? "",
      classCount: subjectClasses.length,
      topicCount: topics.filter(({ class_id }) => classIds.has(class_id)).length,
    };
  });
}

export async function getSubject(subjectId: number) {
  const subjects = await getSubjects();
  return subjects.find(({ id }) => id === subjectId) ?? null;
}

export async function getClassesForSubject(subjectId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [classesResult, transcriptsResult, topicsResult] = await Promise.all([
    supabase
      .from("classes")
      .select(
        classSelection,
      )
      .eq("subject_id", subjectId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("transcripts").select("class_id"),
    supabase.from("topics").select("class_id"),
  ]);

  if (classesResult.error) {
    fail("getClassesForSubject", classesResult.error.message);
  }
  if (transcriptsResult.error) {
    fail("getClassesForSubject transcripts", transcriptsResult.error.message);
  }
  if (topicsResult.error) {
    fail("getClassesForSubject topics", topicsResult.error.message);
  }

  const transcriptIds = new Set(
    (transcriptsResult.data ?? []).map(({ class_id }) => class_id as number),
  );
  const topics = (topicsResult.data ?? []) as { class_id: number }[];

  return ((classesResult.data ?? []) as ClassRow[]).map((row) =>
    toClass(
      row,
      topics.filter(({ class_id }) => class_id === row.id).length,
      transcriptIds.has(row.id),
    ),
  );
}

export async function getClass(classId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [classResult, transcriptResult, topicsResult] = await Promise.all([
    supabase
      .from("classes")
      .select(
        classSelection,
      )
      .eq("id", classId)
      .maybeSingle(),
    supabase
      .from("transcripts")
      .select("class_id")
      .eq("class_id", classId)
      .maybeSingle(),
    supabase.from("topics").select("id").eq("class_id", classId),
  ]);

  if (classResult.error) fail("getClass", classResult.error.message);
  if (transcriptResult.error) {
    fail("getClass transcript", transcriptResult.error.message);
  }
  if (topicsResult.error) fail("getClass topics", topicsResult.error.message);
  if (!classResult.data) return null;

  return toClass(
    classResult.data as ClassRow,
    topicsResult.data?.length ?? 0,
    Boolean(transcriptResult.data),
  );
}

export async function getPublishedSessions(userId: string): Promise<StudySession[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [classesResult, subjectsResult, topicsResult, progressResult] =
    await Promise.all([
      supabase
        .from("classes")
        .select(classSelection)
        .eq("publication_status", "published")
        .not("curriculum_order", "is", null)
        .order("curriculum_order"),
      supabase.from("subjects").select("id,name"),
      supabase.from("topics").select("id,class_id").eq("approval_status", "approved"),
      supabase
        .from("study_progress")
        .select("topic_id,completed_steps")
        .eq("user_id", userId),
    ]);

  if (classesResult.error) fail("getPublishedSessions", classesResult.error.message);
  if (subjectsResult.error) fail("getPublishedSessions subjects", subjectsResult.error.message);
  if (topicsResult.error) fail("getPublishedSessions topics", topicsResult.error.message);
  if (progressResult.error) fail("getPublishedSessions progress", progressResult.error.message);

  const subjects = new Map(
    (subjectsResult.data ?? []).map((subject) => [subject.id as number, subject.name as string]),
  );
  const topics = (topicsResult.data ?? []) as { id: number; class_id: number }[];
  const progress = new Map(
    (progressResult.data ?? []).map((row) => [
      row.topic_id as number,
      Array.isArray(row.completed_steps) ? row.completed_steps.length : 0,
    ]),
  );

  return ((classesResult.data ?? []) as ClassRow[]).map((row) => {
    const classTopics = topics.filter((topic) => topic.class_id === row.id);
    return {
      ...toClass(row, classTopics.length, false),
      subjectName: subjects.get(row.subject_id) ?? "Materia",
      completedSteps: classTopics.reduce(
        (total, topic) => total + (progress.get(topic.id) ?? 0),
        0,
      ),
      totalSteps: classTopics.length * 5,
    };
  });
}

export async function getPublishedSessionNeighbors(classId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id,title,curriculum_code,curriculum_order")
    .eq("publication_status", "published")
    .not("curriculum_order", "is", null)
    .order("curriculum_order");
  if (error) fail("getPublishedSessionNeighbors", error.message);
  const sessions = data ?? [];
  const index = sessions.findIndex((item) => item.id === classId);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: sessions[index - 1] ?? null,
    next: sessions[index + 1] ?? null,
  };
}

export async function getTranscript(classId: number): Promise<Transcript | null> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select("id,class_id,original_text,cleaned_text,processing_status")
    .eq("class_id", classId)
    .maybeSingle();

  if (error) fail("getTranscript", error.message);
  if (!data) return null;
  return {
    id: data.id as number,
    classId: data.class_id as number,
    originalText: data.original_text as string,
    cleanedText: (data.cleaned_text as string | null) ?? "",
    status: data.processing_status as Transcript["status"],
  };
}

export async function getTopicsForClass(classId: number): Promise<Topic[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id,class_id,title,description,position,source_type,approval_status")
    .eq("class_id", classId)
    .order("position");

  if (error) fail("getTopicsForClass", error.message);
  return (data ?? []).map((row) => ({
    id: row.id as number,
    classId: row.class_id as number,
    title: row.title as string,
    description: (row.description as string | null) ?? "",
    position: row.position as number,
    sourceType: row.source_type as Topic["sourceType"],
    approvalStatus: row.approval_status as Topic["approvalStatus"],
  }));
}

export async function getTopic(topicId: number): Promise<Topic | null> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id,class_id,title,description,position,source_type,approval_status")
    .eq("id", topicId)
    .maybeSingle();

  if (error) fail("getTopic", error.message);
  if (!data) return null;
  return {
    id: data.id as number,
    classId: data.class_id as number,
    title: data.title as string,
    description: (data.description as string | null) ?? "",
    position: data.position as number,
    sourceType: data.source_type as Topic["sourceType"],
    approvalStatus: data.approval_status as Topic["approvalStatus"],
  };
}

export async function getStudyProgress(
  topicId: number,
): Promise<StudyProgress | null> {
  await connection();
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("study_progress")
    .select(
      "current_step,material_index,session_minutes,completed_steps,last_activity_at",
    )
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  // The feature remains usable before the new migration is applied.
  if (error) {
    console.warn(`[Supabase] getStudyProgress: ${error.message}`);
    return null;
  }
  if (!data) return null;
  return {
    currentStep: data.current_step as StudyProgress["currentStep"],
    materialIndex: data.material_index as number,
    sessionMinutes: data.session_minutes as StudyProgress["sessionMinutes"],
    completedSteps:
      (data.completed_steps as StudyProgress["completedSteps"] | null) ?? [],
    lastActivityAt: data.last_activity_at as string,
  };
}

export async function getLessonBundle(
  topicId: number,
): Promise<LessonBundle | null> {
  const topic = await getTopic(topicId);
  if (!topic) return null;

  const [studyClass, materialsResult, mapResult, linksResult, cardsResult, examsResult] =
    await Promise.all([
      getClass(topic.classId),
      (await createServerSupabaseClient())
        .from("study_materials")
        .select("id,material_type,title,content,source_origin,version")
        .eq("topic_id", topicId)
        .eq("is_current", true),
      (await createServerSupabaseClient())
        .from("concept_maps")
        .select("title,description,nodes")
        .eq("topic_id", topicId)
        .eq("is_current", true)
        .maybeSingle(),
      (await createServerSupabaseClient())
        .from("topic_references")
        .select(
          "note,legal_references(id,title,url,institution,jurisdiction,citation,retrieved_on)",
        )
        .eq("topic_id", topicId),
      (await createServerSupabaseClient())
        .from("flashcards")
        .select("id,question,answer,position")
        .eq("topic_id", topicId)
        .order("position"),
      (await createServerSupabaseClient())
        .from("exams")
        .select("id,title,description")
        .eq("topic_id", topicId)
        .eq("is_current", true)
        .maybeSingle(),
    ]);

  if (!studyClass) return null;
  if (materialsResult.error) fail("lesson materials", materialsResult.error.message);
  if (mapResult.error) fail("lesson map", mapResult.error.message);
  if (linksResult.error) fail("lesson references", linksResult.error.message);
  if (cardsResult.error) fail("lesson flashcards", cardsResult.error.message);
  if (examsResult.error) fail("lesson exam", examsResult.error.message);

  const subject = await getSubject(studyClass.subjectId);
  if (!subject) return null;
  const transcript = await getTranscript(studyClass.id);

  let exam: Exam | null = null;
  if (examsResult.data) {
    const supabase = await createServerSupabaseClient();
    const { data: questions, error: questionsError } = await supabase
      .from("exam_questions")
      .select("id,question_text,difficulty,position")
      .eq("exam_id", examsResult.data.id)
      .order("position");
    if (questionsError) fail("lesson questions", questionsError.message);
    const questionIds = (questions ?? []).map(({ id }) => id as number);
    const { data: options, error: optionsError } = questionIds.length
      ? await supabase
          .from("exam_options")
          .select("id,question_id,option_text,position")
          .in("question_id", questionIds)
          .order("position")
      : { data: [], error: null };
    if (optionsError) fail("lesson options", optionsError.message);

    exam = {
      id: examsResult.data.id as number,
      title: examsResult.data.title as string,
      description: (examsResult.data.description as string | null) ?? "",
      questions: (questions ?? []).map((question) => ({
        id: question.id as number,
        text: question.question_text as string,
        difficulty: question.difficulty as ExamQuestion["difficulty"],
        position: question.position as number,
        options: (options ?? [])
          .filter(({ question_id }) => question_id === question.id)
          .map((option) => ({
            id: option.id as number,
            text: option.option_text as string,
            position: option.position as number,
          })),
      })),
    };
  }

  const references = (linksResult.data ?? []).flatMap((link) => {
    const raw = link.legal_references as unknown;
    const reference = Array.isArray(raw) ? raw[0] : raw;
    if (!reference || typeof reference !== "object") return [];
    const row = reference as Record<string, unknown>;
    return [{
      id: Number(row.id),
      title: String(row.title),
      url: String(row.url),
      institution: String(row.institution),
      jurisdiction: String(row.jurisdiction),
      citation: row.citation ? String(row.citation) : "",
      retrievedOn: String(row.retrieved_on),
      note: (link.note as string | null) ?? "",
    }];
  });

  return {
    topic,
    studyClass,
    subject,
    transcript,
    materials: (materialsResult.data ?? []).map((row) => ({
      id: row.id as number,
      materialType: row.material_type as StudyMaterial["materialType"],
      title: row.title as string,
      content: row.content as string,
      sourceOrigin: row.source_origin as SourceOrigin,
      version: row.version as number,
    })),
    conceptMap: mapResult.data
      ? {
          title: mapResult.data.title as string,
          description: (mapResult.data.description as string | null) ?? "",
          nodes: mapResult.data.nodes as unknown as ConceptMapNode[],
        }
      : null,
    references,
    flashcards: (cardsResult.data ?? []).map((row) => ({
      id: row.id as number,
      question: row.question as string,
      answer: row.answer as string,
      position: row.position as number,
    })),
    exam,
  };
}

export async function getReviewOverview(
  userId: string,
  now: Date = new Date(),
): Promise<ReviewOverview> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [reviewsResult, checksResult] = await Promise.all([
    supabase
      .from("flashcard_reviews")
      .select("id,flashcard_id,rating,reviewed_at,next_review_at")
      .eq("user_id", userId)
      .order("reviewed_at", { ascending: false }),
    supabase
      .from("quick_check_responses")
      .select("id,topic_id,needs_review,answered_at")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false }),
  ]);

  if (reviewsResult.error) {
    fail("getReviewOverview reviews", reviewsResult.error.message);
  }
  if (checksResult.error) {
    fail("getReviewOverview checks", checksResult.error.message);
  }

  const reviews: FlashcardReviewRecord[] = (reviewsResult.data ?? []).map(
    (row) => ({
      id: row.id as number,
      flashcardId: row.flashcard_id as number,
      rating: row.rating as FlashcardRating,
      reviewedAt: row.reviewed_at as string,
      nextReviewAt: (row.next_review_at as string | null) ?? null,
    }),
  );
  const checks: QuickCheckRecord[] = (checksResult.data ?? []).map((row) => ({
    id: row.id as number,
    topicId: row.topic_id as number,
    needsReview: row.needs_review as boolean,
    answeredAt: row.answered_at as string,
  }));
  const latestReviews = getLatestFlashcardReviews(reviews);
  const latestChecks = getLatestQuickChecks(checks);
  const flashcardIds = latestReviews.map((review) => review.flashcardId);

  const cardsResult = flashcardIds.length
    ? await supabase
        .from("flashcards")
        .select("id,topic_id,question,answer,position")
        .in("id", flashcardIds)
    : { data: [], error: null };
  if (cardsResult.error) {
    fail("getReviewOverview flashcards", cardsResult.error.message);
  }

  const cardRows = (cardsResult.data ?? []).map((row) => ({
    id: row.id as number,
    topicId: row.topic_id as number,
    question: row.question as string,
    answer: row.answer as string,
    position: row.position as number,
  }));
  const topicIds = [
    ...new Set([
      ...cardRows.map((card) => card.topicId),
      ...latestChecks.map((check) => check.topicId),
    ]),
  ];
  const topicsResult = topicIds.length
    ? await supabase
        .from("topics")
        .select(
          "id,title,class_id,classes!inner(id,title,curriculum_code,publication_status)",
        )
        .in("id", topicIds)
        .eq("approval_status", "approved")
        .eq("classes.publication_status", "published")
    : { data: [], error: null };
  if (topicsResult.error) {
    fail("getReviewOverview topics", topicsResult.error.message);
  }

  const topics = new Map(
    (topicsResult.data ?? []).flatMap((row) => {
      const rawClass = row.classes as unknown;
      const classValue = Array.isArray(rawClass) ? rawClass[0] : rawClass;
      if (!classValue || typeof classValue !== "object") return [];
      const studyClass = classValue as Record<string, unknown>;
      return [
        [
          row.id as number,
          {
            id: row.id as number,
            title: row.title as string,
            classId: Number(studyClass.id),
            classTitle: String(studyClass.title),
            curriculumCode: studyClass.curriculum_code
              ? String(studyClass.curriculum_code)
              : "",
          },
        ] as const,
      ];
    }),
  );
  const visibleCards = new Map(
    cardRows
      .filter((card) => topics.has(card.topicId))
      .map((card) => [card.id, card] as const),
  );
  const visibleReviews = reviews.filter((review) =>
    visibleCards.has(review.flashcardId),
  );
  const summary = summarizeFlashcardReviews(visibleReviews, now);
  const currentDifficultChecks = latestChecks.filter(
    (check) => check.needsReview && topics.has(check.topicId),
  ).length;
  const dueCards = summary.due.flatMap((review) => {
    const card = visibleCards.get(review.flashcardId);
    if (!card) return [];
    const topic = topics.get(card.topicId);
    if (!topic) return [];

    return [
      {
        id: card.id,
        question: card.question,
        answer: card.answer,
        position: card.position,
        topicId: topic.id,
        topicTitle: topic.title,
        classId: topic.classId,
        classTitle: topic.classTitle,
        curriculumCode: topic.curriculumCode,
        rating: review.rating,
        nextReviewAt: review.nextReviewAt,
      },
    ];
  });

  return {
    dueCards,
    currentDifficultCards: summary.currentDifficultCount,
    currentDifficultChecks,
    currentDifficultCount:
      summary.currentDifficultCount + currentDifficultChecks,
    nextReviewAt: summary.nextReviewAt,
  };
}
