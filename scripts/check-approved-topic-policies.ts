import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260821023330_restrict_reading_to_approved_topics.sql",
);
const sql = normalize(readFileSync(migrationPath, "utf8"));

function normalize(value: string) {
  return value
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function requirePattern(description: string, value: string, pattern: RegExp) {
  if (!pattern.test(value)) {
    throw new Error(`La protección de temas no garantiza: ${description}.`);
  }
}

requirePattern("una transacción atómica", sql, /^begin;.*commit;$/);

const policies = [
  "topics_select_published_or_admin",
  "study_materials_select_published_or_admin",
  "references_select_published_or_admin",
  "topic_references_select_published_or_admin",
  "concept_maps_select_published_or_admin",
  "flashcards_select_published_or_admin",
  "exams_select_published_or_admin",
  "exam_questions_select_published_or_admin",
  "exam_options_select_published_or_admin",
];

for (const policy of policies) {
  requirePattern(
    `reemplazo idempotente de ${policy}`,
    sql,
    new RegExp(`drop policy if exists ${policy} .*create policy ${policy} `),
  );
}

const approvalChecks = sql.match(/topics\.approval_status = 'approved'/g);
if (approvalChecks?.length !== policies.length) {
  throw new Error(
    `Se esperaban ${policies.length} verificaciones de aprobación y se encontraron ${approvalChecks?.length ?? 0}.`,
  );
}

const publicationChecks = sql.match(
  /classes\.publication_status = 'published'/g,
);
if (publicationChecks?.length !== policies.length) {
  throw new Error(
    `Se esperaban ${policies.length} verificaciones de publicación y se encontraron ${publicationChecks?.length ?? 0}.`,
  );
}

const adminChecks = sql.match(/\(select private\.is_admin\(\)\)/g);
if (adminChecks?.length !== policies.length) {
  throw new Error(
    `Se esperaban ${policies.length} excepciones editoriales y se encontraron ${adminChecks?.length ?? 0}.`,
  );
}

for (const relation of [
  "study_materials.topic_id",
  "topic_references.topic_id",
  "concept_maps.topic_id",
  "flashcards.topic_id",
  "exams.topic_id",
  "exam_questions.exam_id",
  "exam_options.question_id",
]) {
  requirePattern(
    `encadenamiento del recurso ${relation}`,
    sql,
    new RegExp(relation.replace(".", "\\.")),
  );
}

requirePattern(
  "referencias legales enlazadas mediante un tema",
  sql,
  /topic_references\.reference_id = legal_references\.id/,
);

const dalPath = join(process.cwd(), "lib", "data", "academic.ts");
const dal = readFileSync(dalPath, "utf8");
const getTopicStart = dal.indexOf("export async function getTopic(");
const continuationStart = dal.indexOf(
  "export async function getStudyContinuation(",
);
const lessonStart = dal.indexOf("export async function getLessonBundle(");

if (getTopicStart < 0 || continuationStart < 0 || lessonStart < 0) {
  throw new Error("No se localizaron las funciones protegidas de la DAL.");
}

const getTopicSource = dal.slice(getTopicStart, continuationStart);
const lessonSource = dal.slice(lessonStart);
requirePattern(
  "filtro estudiantil de aprobación en getTopic",
  getTopicSource,
  /user\?\.role !== "admin"[\s\S]*\.eq\("approval_status", "approved"\)/,
);
requirePattern(
  "rechazo explícito para estudiantes en getLessonBundle",
  lessonSource,
  /topic\.approvalStatus !== "approved" && user\?\.role !== "admin"/,
);

console.log(
  "✓ RLS y DAL ocultan temas no aprobados y conservan el acceso editorial.",
);
