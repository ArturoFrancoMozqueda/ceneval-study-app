import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const flashcards = readFileSync("components/flashcards-deck.tsx", "utf8");
const exam = readFileSync("components/exam-player.tsx", "utf8");
const lesson = readFileSync("components/lesson-view.tsx", "utf8");
const appShell = readFileSync("components/app-shell.tsx", "utf8");
const marketingShell = readFileSync("components/marketing-shell.tsx", "utf8");
const publicationControls = readFileSync("components/publication-controls.tsx", "utf8");
const conceptMapEditor = readFileSync("components/concept-map-edit-form.tsx", "utf8");
const journeyEditor = readFileSync("components/topic-learning-journey-edit-form.tsx", "utf8");
const classDetail = readFileSync("components/class-detail.tsx", "utf8");
const classForm = readFileSync("components/class-form.tsx", "utf8");
const subjectDetail = readFileSync("components/subject-detail.tsx", "utf8");
const subjectForm = readFileSync("components/subject-form.tsx", "utf8");
const adaptivePractice = readFileSync("components/adaptive-practice.tsx", "utf8");
const topicsReview = readFileSync("components/topics-review.tsx", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");
const classPage = readFileSync("app/clases/[classId]/page.tsx", "utf8");
const subjectPage = readFileSync("app/materias/[subjectId]/page.tsx", "utf8");
const academicActions = readFileSync("app/actions/academic.ts", "utf8");
const journeyPage = readFileSync(
  "app/administrar/clases/[classId]/temas/[topicId]/learning-journey/page.tsx",
  "utf8",
);

test("las tarjetas nombran su contenido y restauran foco al avanzar", () => {
  assert.match(flashcards, /aria-labelledby=.*action.*content/);
  assert.match(flashcards, /Revelar respuesta para:/);
  assert.doesNotMatch(flashcards, /aria-label=\{revealed/);
  assert.match(flashcards, /aria-live="polite"/);
  assert.match(flashcards, /cardButtonRef\.current\?\.focus\(\)/);
  assert.match(flashcards, /completionTitleRef\.current\?\.focus\(\)/);
});

test("el examen usa la pregunta como leyenda y enfoca cambios y resultado", () => {
  assert.match(exam, /<legend[\s\S]*currentQuestion\.text[\s\S]*<\/legend>/);
  assert.match(exam, /questionRef\.current\?\.focus\(\)/);
  assert.match(exam, /resultTitleRef\.current\?\.focus\(\)/);
});

test("las preguntas largas permanecen dentro de la tarjeta del examen", () => {
  assert.match(exam, /<form[\s\S]*className="min-w-0"/);
  assert.match(
    exam,
    /<fieldset[\s\S]*className="min-w-0 max-w-full rounded-2xl/,
  );
  assert.match(
    exam,
    /<legend[\s\S]*className="max-w-full whitespace-normal px-2"/,
  );
  assert.match(
    exam,
    /className="mt-2 block break-words font-semibold leading-7 text-foreground"/,
  );
  assert.match(
    exam,
    /className="min-w-0 break-words text-sm leading-6"/,
  );
});

test("clases y materias inválidas terminan en la página 404", () => {
  for (const source of [classPage, subjectPage]) {
    assert.match(source, /Number\.isInteger/);
    assert.match(source, /< 1\) notFound\(\)/);
  }
});

test("los controles de texto independientes del tema alcanzan 44 px", () => {
  for (const label of ["← Volver a la sesión", "Consultar fuentes jurídicas"]) {
    const labelIndex = lesson.indexOf(label);
    assert.ok(labelIndex >= 0, `No se encontró ${label}`);
    const buttonStart = lesson.lastIndexOf("<button", labelIndex);
    const buttonSource = lesson.slice(buttonStart, labelIndex);
    assert.match(buttonSource, /inline-flex min-h-11 items-center/);
  }
});

test("cerrar sesión mantiene un área de interacción suficiente", () => {
  const labelIndex = appShell.indexOf("Cerrar sesión");
  assert.ok(labelIndex >= 0, "No se encontró Cerrar sesión");
  const buttonStart = appShell.lastIndexOf("<button", labelIndex);
  const buttonSource = appShell.slice(buttonStart, labelIndex);
  assert.match(buttonSource, /inline-flex min-h-11 items-center/);
});

test("las rutas públicas también permiten saltar la navegación", () => {
  assert.match(marketingShell, /href="#contenido-principal"/);
  assert.match(marketingShell, />\s*Saltar al contenido principal\s*</);
});

test("los enlaces de marca conservan su texto visible en el nombre accesible", () => {
  for (const shell of [appShell, marketingShell]) {
    assert.doesNotMatch(shell, /aria-label="Sube Legal, ir al inicio"/);
    assert.match(shell, /<Link[^>]*href="\/"[\s\S]*>\s*, ir al inicio\s*<\/span>/);
  }
});

test("el diálogo editorial gestiona foco, escape y tabulación", () => {
  assert.match(publicationControls, /cancelConfirmationRef\.current\?\.focus\(\)/);
  assert.match(publicationControls, /event\.key === "Escape"/);
  assert.match(publicationControls, /event\.key !== "Tab"/);
  assert.match(publicationControls, /confirmationTriggerRef\.current\?\.focus\(\)/);
  assert.match(publicationControls, /document\.body\.style\.overflow = "hidden"/);
});

test("abrir y cerrar fuentes conserva el contexto de teclado", () => {
  assert.match(lesson, /sourcesBackRef\.current\?\.focus\(\)/);
  assert.match(lesson, /sourcesTriggerRef\.current\?\.focus\(\)/);
});

test("los controles Quitar alcanzan el mínimo de 24 px", () => {
  for (const editor of [conceptMapEditor, journeyEditor]) {
    const labelIndex = editor.indexOf("Quitar");
    const buttonStart = editor.lastIndexOf("<button", labelIndex);
    assert.match(editor.slice(buttonStart, labelIndex), /inline-flex min-h-6 items-center/);
  }
});

test("los formularios no roban el foco al abrir y enfocan el primer campo inválido", () => {
  for (const form of [classForm, subjectForm]) {
    assert.doesNotMatch(form, /autoFocus/);
    assert.match(form, /InputRef\.current\?\.focus\(\)/);
    assert.match(form, /aria-busy=\{isSubmitting\}/);
  }
});

test("los fallos generales de guardado no se presentan como errores de un campo", () => {
  assert.match(classForm, /setFormError\(result\.error/);
  assert.match(subjectForm, /setFormError\(result\.error\)/);
  for (const form of [classForm, subjectForm]) {
    assert.match(form, /catch \{/);
    assert.match(form, /Revisa tu conexión e intenta nuevamente/);
    assert.match(form, /formError[\s\S]*role="alert"/);
  }
});

test("la navegación no crea regiones vacías y las migas tienen relaciones semánticas", () => {
  assert.match(classDetail, /neighbors\.previous \|\| neighbors\.next \? \(/);
  assert.doesNotMatch(classDetail, /:\s*<span\s*\/>/);
  assert.match(subjectDetail, /aria-label="Migas de navegación"/);
  assert.match(subjectDetail, /<ol[\s\S]*aria-current="page"/);
});

test("los enlaces externos avisan el cambio de pestaña", () => {
  const hint = /abre en una pestaña nueva/;
  assert.match(lesson, hint);
  assert.match(adaptivePractice, hint);
});

test("la interfaz editorial permanece en español y no conserva páginas de relleno", () => {
  for (const source of [journeyEditor, journeyPage]) {
    assert.doesNotMatch(
      source,
      />\s*(?:Prompt|Quick checks?|learning journey)/i,
    );
  }
  assert.doesNotMatch(
    academicActions,
    /error:\s*"[^"]*(?:prompt|quick check|learning journey)/i,
  );
  assert.doesNotMatch(topicsReview, /demostrativas|integrar IA|llegará con IA/);
  assert.doesNotMatch(topicsReview, /Sin descripción\./);
  assert.match(topicsReview, /paquete editorial/);
  assert.equal(existsSync("components/placeholder-page.tsx"), false);
});

test("el foco evita barras fijas y permanece visible en contraste forzado", () => {
  assert.match(globalStyles, /scroll-margin-block:\s*5rem/);
  assert.match(globalStyles, /@media \(forced-colors: active\)/);
  assert.match(globalStyles, /outline:\s*3px solid Highlight/);
});
