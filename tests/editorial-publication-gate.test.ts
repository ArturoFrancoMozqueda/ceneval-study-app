import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260821164144_editorial_publication_gate.sql",
    import.meta.url,
  ),
  "utf8",
);
const academicDal = readFileSync(
  new URL("../lib/data/academic.ts", import.meta.url),
  "utf8",
);
const lessonView = readFileSync(
  new URL("../components/lesson-view.tsx", import.meta.url),
  "utf8",
);
const publicationControls = readFileSync(
  new URL("../components/publication-controls.tsx", import.meta.url),
  "utf8",
);

test("la base exige revisión, aprobación total y digest vigente", () => {
  assert.match(migration, /old\.publication_status <> 'review'/);
  assert.match(migration, /approval_status <> 'approved'/);
  assert.match(migration, /review\.content_version = new\.content_version/);
  assert.match(migration, /review\.content_digest = new\.content_digest/);
  assert.match(migration, /review\.legal_verified_on is not null/);
});

test("una modificación invalida la aprobación editorial", () => {
  assert.match(migration, /create function private\.touch_class_editorial_content/);
  assert.match(migration, /set invalidated_at = coalesce\(invalidated_at, now\(\)\)/);
  assert.match(migration, /content_version = content_version \+ 1/);
});

test("un rechazo posterior invalida la aprobación de la misma versión", () => {
  assert.match(
    migration,
    /if new\.verdict = 'rejected' then[\s\S]*verdict = 'approved'[\s\S]*invalidated_at is null/,
  );
  assert.match(
    migration,
    /content_version = new\.content_version[\s\S]*content_digest = new\.content_digest/,
  );
});

test("la base valida identidad, estado y versión antes de aceptar un dictamen", () => {
  assert.match(
    migration,
    /profiles\.id = new\.reviewer_id[\s\S]*profiles\.role = 'admin'/,
  );
  assert.match(migration, /if current_status <> 'review' then/);
  assert.match(
    migration,
    /new\.content_version <> current_version[\s\S]*new\.content_digest <> current_digest/,
  );
  assert.match(
    migration,
    /create trigger class_editorial_reviews_validate_insert[\s\S]*before insert/,
  );
});

test("las transcripciones quedan limitadas a administración", () => {
  assert.match(migration, /drop policy if exists transcripts_select_published_or_admin/);
  assert.match(migration, /create policy transcripts_select_admin_only/);
  assert.match(migration, /using \(\(select private\.is_admin\(\)\)\)/);
  assert.match(academicDal, /if \(user\?\.role !== "admin"\) return null/);
  assert.match(
    academicDal,
    /user\?\.role === "admin" \? await getTranscript\(studyClass\.id\) : null/,
  );
  assert.match(lessonView, /\{lesson\.transcript \? \(/);
});

test("administración puede registrar el dictamen desde el estado de revisión", () => {
  assert.match(publicationControls, /currentStatus === "review"/);
  assert.match(publicationControls, /recordEditorialReviewAction\(/);
  assert.match(publicationControls, /Fecha de verificación jurídica/);
  assert.match(publicationControls, /Aprobar versión/);
  assert.match(publicationControls, /Rechazar versión/);
  assert.match(publicationControls, /role=\{reviewFeedback\.kind === "error" \? "alert" : "status"\}/);
});

test("administración puede leer revisiones y estudiantes solo la vigente publicada", () => {
  assert.match(
    migration,
    /create policy class_editorial_reviews_select_published_verification[\s\S]*\(select private\.is_admin\(\)\)[\s\S]*or \([\s\S]*verdict = 'approved'/,
  );
  assert.match(migration, /invalidated_at is null/);
  assert.match(migration, /classes\.publication_status = 'published'/);
});
