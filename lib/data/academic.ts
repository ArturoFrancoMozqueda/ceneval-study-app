import "server-only";

import { writeDependencyFailure } from "@/lib/operations/safe-log";

import { connection } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import {
  deriveAdminCatalog,
  type AdminCatalogGroup,
  type AdminCatalogRow,
} from "@/lib/data/admin-catalog";
import { relationRows } from "@/lib/data/relation-rows";
import {
  parseReviewOverviewRow,
  type ReviewOverviewPayload,
} from "@/lib/data/review-overview";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  deriveStudyContinuation,
  type StudyContinuation,
} from "@/lib/study/continuation";

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
  examCompleted: boolean;
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
  legalVerifiedOn: string;
  note: string;
};

export type Flashcard = {
  id: number;
  question: string;
  answer: string;
  position: number;
};

export type ReviewFlashcard = ReviewOverviewPayload["dueCards"][number];
export type ReviewOverview = ReviewOverviewPayload;

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

export type TopicLearningJourney = {
  openingPrompt: string;
  quickChecks: Array<{
    prompt: string;
    answer: string;
    feedback: string;
  }>;
  practicalCase: {
    facts: string;
    question: string;
    legalRule: string;
    reasoning: string;
    conclusion: string;
  };
  closingPrompt: string;
  nextActivity: string;
};

export type LessonBundle = {
  topic: Topic;
  studyClass: StudyClass;
  subject: Subject;
  materials: StudyMaterial[];
  conceptMap: {
    title: string;
    description: string;
    nodes: ConceptMapNode[];
  } | null;
  references: LegalReference[];
  learningJourney: TopicLearningJourney | null;
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
  classes?:
    | Array<{
        id: number;
        topics?: Array<{ id: number }> | { id: number } | null;
      }>
    | {
        id: number;
        topics?: Array<{ id: number }> | { id: number } | null;
      }
    | null;
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

type ClassOverviewRow = ClassRow & {
  topics?: Array<{ id: number }> | { id: number } | null;
};

function fail(operation: string, error?: unknown): never {
  writeDependencyFailure({ error, operation });
  throw new Error("No pudimos consultar los datos. Intenta nuevamente.");
}

function toClass(
  row: ClassRow,
  topicCount: number,
): StudyClass {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    classDate: row.class_date ?? "",
    teacher: row.teacher ?? "",
    description: row.description ?? "",
    topicCount,
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
const subjectOverviewSelection =
  "id,name,description,classes(id,topics(id))";
const classOverviewSelection =
  `${classSelection},topics(id)`;
const adminCatalogSelection =
  "id,name,classes(id,title,publication_status,published_at,created_at,topics(id))";

function toSubject(row: SubjectRow): Subject {
  const subjectClasses = relationRows(row.classes);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    classCount: subjectClasses.length,
    topicCount: subjectClasses.reduce(
      (total, studyClass) => total + relationRows(studyClass.topics).length,
      0,
    ),
  };
}

export async function getAdminCatalog(): Promise<AdminCatalogGroup[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const catalogResult = await supabase
    .from("subjects")
    .select(adminCatalogSelection)
    .order("name", { ascending: true })
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
      referencedTable: "classes",
    })
    .order("created_at", { ascending: false, referencedTable: "classes" });

  if (catalogResult.error) fail("getAdminCatalog", catalogResult.error);

  return deriveAdminCatalog((catalogResult.data ?? []) as AdminCatalogRow[]);
}

export async function getSubjects(): Promise<Subject[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const subjectsResult = await supabase
    .from("subjects")
    .select(subjectOverviewSelection)
    .order("name", { ascending: true });

  if (subjectsResult.error) fail("getSubjects", subjectsResult.error);

  return ((subjectsResult.data ?? []) as SubjectRow[]).map(toSubject);
}

export async function getSubject(subjectId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const subjectResult = await supabase
    .from("subjects")
    .select(subjectOverviewSelection)
    .eq("id", subjectId)
    .maybeSingle();

  if (subjectResult.error) fail("getSubject", subjectResult.error);
  return subjectResult.data ? toSubject(subjectResult.data as SubjectRow) : null;
}

export async function getClassesForSubject(subjectId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const classesResult = await supabase
    .from("classes")
    .select(classOverviewSelection)
    .eq("subject_id", subjectId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (classesResult.error) {
    fail("getClassesForSubject", classesResult.error);
  }

  return ((classesResult.data ?? []) as ClassOverviewRow[]).map((row) =>
    toClass(row, relationRows(row.topics).length),
  );
}

export async function getClass(classId: number) {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [classResult, topicsResult] = await Promise.all([
    supabase
      .from("classes")
      .select(
        classSelection,
      )
      .eq("id", classId)
      .maybeSingle(),
    supabase.from("topics").select("id").eq("class_id", classId),
  ]);

  if (classResult.error) fail("getClass", classResult.error);
  if (topicsResult.error) fail("getClass topics", topicsResult.error);
  if (!classResult.data) return null;

  return toClass(
    classResult.data as ClassRow,
    topicsResult.data?.length ?? 0,
  );
}

export async function getPublishedSessions(userId: string): Promise<StudySession[]> {
  await connection();
  const supabase = await createServerSupabaseClient();
  const [
    classesResult,
    subjectsResult,
    topicsResult,
    progressResult,
    attemptsResult,
  ] =
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
      supabase
        .from("exam_attempts")
        .select("completed_at,exams!inner(topic_id,is_current)")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .eq("exams.is_current", true),
    ]);

  if (classesResult.error) fail("getPublishedSessions", classesResult.error);
  if (subjectsResult.error) fail("getPublishedSessions subjects", subjectsResult.error);
  if (topicsResult.error) fail("getPublishedSessions topics", topicsResult.error);
  if (progressResult.error) fail("getPublishedSessions progress", progressResult.error);
  if (attemptsResult.error) fail("getPublishedSessions attempts", attemptsResult.error);

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
  const completedExamTopics = new Set(
    (attemptsResult.data ?? []).flatMap((row) =>
      relationRows(row.exams).map((exam) => Number(exam.topic_id)),
    ),
  );

  return ((classesResult.data ?? []) as ClassRow[]).map((row) => {
    const classTopics = topics.filter((topic) => topic.class_id === row.id);
    return {
      ...toClass(row, classTopics.length),
      subjectName: subjects.get(row.subject_id) ?? "Materia",
      completedSteps: classTopics.reduce(
        (total, topic) => total + (progress.get(topic.id) ?? 0),
        0,
      ),
      totalSteps: classTopics.length * 3,
      examCompleted:
        classTopics.length > 0 &&
        classTopics.every((topic) => completedExamTopics.has(topic.id)),
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
  if (error) fail("getPublishedSessionNeighbors", error);
  const sessions = data ?? [];
  const index = sessions.findIndex((item) => item.id === classId);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: sessions[index - 1] ?? null,
    next: sessions[index + 1] ?? null,
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

  if (error) fail("getTopicsForClass", error);
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
  const user = await getCurrentUser();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("topics")
    .select("id,class_id,title,description,position,source_type,approval_status")
    .eq("id", topicId);
  if (user?.role !== "admin") {
    query = query.eq("approval_status", "approved");
  }
  const { data, error } = await query.maybeSingle();

  if (error) fail("getTopic", error);
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

export async function getStudyContinuation(
  topicId: number,
): Promise<StudyContinuation> {
  await connection();
  if (!Number.isInteger(topicId) || topicId <= 0) {
    return { kind: "unavailable" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: currentRow, error: currentError } = await supabase
    .from("topics")
    .select(
      "id,class_id,position,approval_status,classes!inner(id,publication_status,curriculum_order,curriculum_code)",
    )
    .eq("id", topicId)
    .eq("approval_status", "approved")
    .eq("classes.publication_status", "published")
    .maybeSingle();

  if (currentError) {
    fail("getStudyContinuation current topic", currentError);
  }
  if (!currentRow) return { kind: "unavailable" };

  const rawClass = currentRow.classes as unknown;
  const currentClass = Array.isArray(rawClass) ? rawClass[0] : rawClass;
  if (!currentClass || typeof currentClass !== "object") {
    return { kind: "unavailable" };
  }
  const classRecord = currentClass as Record<string, unknown>;
  const curriculumOrder = Number(classRecord.curriculum_order);
  const curriculumCode = String(classRecord.curriculum_code ?? "");
  if (!Number.isInteger(curriculumOrder) || !/^C\d{2}$/.test(curriculumCode)) {
    return { kind: "unavailable" };
  }

  const [topicResult, classResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id,class_id,title,position")
      .eq("class_id", currentRow.class_id)
      .eq("approval_status", "approved")
      .gt("position", currentRow.position)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("classes")
      .select("id,title,curriculum_order,curriculum_code")
      .eq("publication_status", "published")
      .gt("curriculum_order", curriculumOrder)
      .not("curriculum_code", "is", null)
      .order("curriculum_order", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (topicResult.error) {
    fail("getStudyContinuation next topic", topicResult.error);
  }
  if (classResult.error) {
    fail("getStudyContinuation next class", classResult.error);
  }

  return deriveStudyContinuation({
    current: {
      id: currentRow.id as number,
      classId: currentRow.class_id as number,
      position: currentRow.position as number,
      curriculumOrder,
      curriculumCode,
    },
    topics: topicResult.data
      ? [
          {
            id: topicResult.data.id as number,
            classId: topicResult.data.class_id as number,
            title: topicResult.data.title as string,
            position: topicResult.data.position as number,
            approved: true,
          },
        ]
      : [],
    classes: classResult.data
      ? [
          {
            id: classResult.data.id as number,
            title: classResult.data.title as string,
            curriculumOrder: classResult.data.curriculum_order as number,
            curriculumCode: classResult.data.curriculum_code as string,
            published: true,
          },
        ]
      : [],
  });
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
    writeDependencyFailure({
      error,
      level: "info",
      operation: "getStudyProgress",
    });
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
  const [topic, user] = await Promise.all([getTopic(topicId), getCurrentUser()]);
  if (
    !topic ||
    (topic.approvalStatus !== "approved" && user?.role !== "admin")
  ) {
    return null;
  }

  const [studyClass, materialsResult, mapResult, linksResult, journeyResult, cardsResult, examsResult] =
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
        .from("topic_learning_journeys")
        .select("content")
        .eq("topic_id", topicId)
        .maybeSingle(),
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
  if (materialsResult.error) fail("lesson materials", materialsResult.error);
  if (mapResult.error) fail("lesson map", mapResult.error);
  if (linksResult.error) fail("lesson references", linksResult.error);
  if (journeyResult.error) fail("lesson journey", journeyResult.error);
  if (cardsResult.error) fail("lesson flashcards", cardsResult.error);
  if (examsResult.error) fail("lesson exam", examsResult.error);

  const subject = await getSubject(studyClass.subjectId);
  if (!subject) return null;
  const verificationResult = await (await createServerSupabaseClient())
    .from("class_editorial_reviews")
    .select("legal_verified_on")
    .eq("class_id", studyClass.id)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (verificationResult.error) {
    fail("lesson legal verification", verificationResult.error);
  }
  const legalVerifiedOn = verificationResult.data?.legal_verified_on
    ? String(verificationResult.data.legal_verified_on)
    : "";

  let exam: Exam | null = null;
  if (examsResult.data) {
    const supabase = await createServerSupabaseClient();
    const { data: questions, error: questionsError } = await supabase
      .from("exam_questions")
      .select("id,question_text,difficulty,position")
      .eq("exam_id", examsResult.data.id)
      .order("position");
    if (questionsError) fail("lesson questions", questionsError);
    const questionIds = (questions ?? []).map(({ id }) => id as number);
    const { data: options, error: optionsError } = questionIds.length
      ? await supabase
          .from("exam_options")
          .select("id,question_id,option_text,position")
          .in("question_id", questionIds)
          .order("position")
      : { data: [], error: null };
    if (optionsError) fail("lesson options", optionsError);

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
      legalVerifiedOn,
      note: (link.note as string | null) ?? "",
    }];
  });

  return {
    topic,
    studyClass,
    subject,
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
    learningJourney: journeyResult.data?.content
      ? (journeyResult.data.content as unknown as TopicLearningJourney)
      : null,
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
): Promise<ReviewOverview> {
  void userId;
  await connection();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("get_review_overview_v1")
    .single();
  if (error) fail("getReviewOverview", error);

  try {
    return parseReviewOverviewRow(data);
  } catch (error) {
    fail("getReviewOverview contract", error);
  }
}
