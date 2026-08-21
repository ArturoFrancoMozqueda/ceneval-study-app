import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260820225524_restrict_learning_activity_to_published_content.sql",
);
const sql = readFileSync(migrationPath, "utf8")
  .replace(/--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

function requirePattern(description: string, pattern: RegExp) {
  if (!pattern.test(sql)) {
    throw new Error(`La migración no garantiza: ${description}.`);
  }
}

requirePattern("una transacción atómica", /^begin;.*commit;$/);

for (const policy of [
  "flashcard_reviews_insert_own",
  "study_progress_insert_own",
  "study_progress_update_own",
  "quick_check_responses_insert_own",
]) {
  requirePattern(
    `reemplazo idempotente de ${policy}`,
    new RegExp(`drop policy if exists ${policy} .*create policy ${policy} `),
  );
}

requirePattern(
  "propiedad y publicación en revisiones de tarjetas",
  /create policy flashcard_reviews_insert_own .* for insert to authenticated with check \( \(select auth\.uid\(\)\) = user_id and exists \( select 1 from public\.flashcards join public\.topics on topics\.id = flashcards\.topic_id join public\.classes on classes\.id = topics\.class_id where flashcards\.id = flashcard_reviews\.flashcard_id and classes\.publication_status = 'published' \) \);/,
);
requirePattern(
  "propiedad y publicación al crear progreso",
  /create policy study_progress_insert_own .* for insert to authenticated with check \( \(select auth\.uid\(\)\) = user_id and exists \( select 1 from public\.topics join public\.classes on classes\.id = topics\.class_id where topics\.id = study_progress\.topic_id and classes\.publication_status = 'published' \) \);/,
);
requirePattern(
  "propiedad y publicación antes y después de actualizar progreso",
  /create policy study_progress_update_own .* for update to authenticated using \( \(select auth\.uid\(\)\) = user_id and exists \(.*classes\.publication_status = 'published'.*\) \) with check \( \(select auth\.uid\(\)\) = user_id and exists \(.*classes\.publication_status = 'published'.*\) \);/,
);
requirePattern(
  "propiedad y publicación en comprobaciones rápidas",
  /create policy quick_check_responses_insert_own .* for insert to authenticated with check \( \(select auth\.uid\(\)\) = user_id and exists \( select 1 from public\.topics join public\.classes on classes\.id = topics\.class_id where topics\.id = quick_check_responses\.topic_id and classes\.publication_status = 'published' \) \);/,
);

const publishedChecks = sql.match(/classes\.publication_status = 'published'/g);
if (publishedChecks?.length !== 5) {
  throw new Error(
    `Se esperaban 5 verificaciones de publicación y se encontraron ${publishedChecks?.length ?? 0}.`,
  );
}

const legacyGuardPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260729173157_restrict_rls_auto_enable_execute.sql",
);
const legacyGuardSql = readFileSync(legacyGuardPath, "utf8")
  .replace(/--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

if (
  !/to_regprocedure\('public\.rls_auto_enable\(\)'\) is not null/.test(
    legacyGuardSql,
  ) ||
  !/execute 'revoke execute on function public\.rls_auto_enable\(\) '/.test(
    legacyGuardSql,
  )
) {
  throw new Error(
    "La migración histórica de RLS no tolera instalaciones nuevas sin el helper.",
  );
}

console.log(
  "✓ Las políticas RLS exigen contenido publicado y toleran instalaciones nuevas.",
);
