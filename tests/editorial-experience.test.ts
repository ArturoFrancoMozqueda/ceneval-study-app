import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deriveEditorialOnboarding } from "../lib/editorial-onboarding";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("el shell permite saltar la navegación y enfocar el contenido", () => {
  const shell = source("components/app-shell.tsx");

  assert.match(shell, /href="#contenido-principal"/);
  assert.match(shell, />\s*Saltar al contenido principal\s*</);
  assert.equal(shell.match(/id="contenido-principal"/g)?.length, 2);
  assert.equal(shell.match(/tabIndex=\{-1\}/g)?.length, 2);
  assert.match(shell, /<header className=/);
  assert.match(shell, /<nav aria-label="Navegación principal"/);
});

test("los metadatos describen la biblioteca editorial y anuncian el acceso", () => {
  const layout = source("app/layout.tsx");
  const signIn = source("app/iniciar-sesion/page.tsx");
  const subjects = source("app/materias/page.tsx");

  assert.doesNotMatch(layout, /Organiza tus materias, clases y transcripciones/);
  assert.match(layout, /clases editoriales revisadas/);
  assert.match(signIn, /title: "Iniciar sesión"/);
  assert.match(subjects, /title: "Biblioteca de Derecho"/);
});

test("el primer estado administrativo dirige al flujo editorial honesto", () => {
  const admin = source("app/administrar/page.tsx");

  assert.ok(admin.indexOf("await requireAdmin()") < admin.indexOf("await getAdminCatalog()"));
  assert.match(admin, /const groups = await getAdminCatalog\(\)/);
  assert.doesNotMatch(admin, /getSubjects|getClassesForSubject|subjects\.map\(async/);
  assert.match(admin, /Empieza aquí/);
  assert.match(admin, /deriveEditorialOnboarding\(subjects\)/);
  assert.match(admin, /href=\{onboarding\.actionHref\}/);
  assert.doesNotMatch(admin, /genera tu propio|pega tu transcripción/i);
});

test("sin materias, el onboarding crea primero la estructura académica", () => {
  const onboarding = deriveEditorialOnboarding([]);

  assert.equal(onboarding.actionHref, "/materias/nueva");
  assert.equal(onboarding.actionLabel, "Crear la primera materia");
  assert.match(onboarding.description, /Primero crea la materia/);
});

test("con una materia vacía, el onboarding agrega ahí la primera clase", () => {
  const onboarding = deriveEditorialOnboarding([
    { id: 17, name: "Derecho constitucional" },
    { id: 18, name: "Derecho civil" },
  ]);

  assert.equal(onboarding.actionHref, "/materias/17/clases/nueva");
  assert.equal(onboarding.actionLabel, "Agregar la primera clase");
  assert.match(onboarding.description, /Derecho constitucional/);
  assert.doesNotMatch(onboarding.description, /Primero crea la materia/);
});

test("el progreso de sesiones expone valor, límites y rol accesibles", () => {
  const sessions = source("app/sesiones/page.tsx");

  assert.match(sessions, /role="progressbar"/);
  assert.match(sessions, /aria-valuemin=\{0\}/);
  assert.match(sessions, /aria-valuemax=\{100\}/);
  assert.match(sessions, /aria-valuenow=\{percent\}/);
});

test("las rutas editoriales inválidas responden con el 404 de Next", () => {
  const routes = [
    "app/administrar/clases/[classId]/page.tsx",
    "app/administrar/clases/[classId]/temas/[topicId]/examen/page.tsx",
    "app/administrar/clases/[classId]/temas/[topicId]/flashcards/page.tsx",
    "app/administrar/clases/[classId]/temas/[topicId]/learning-journey/page.tsx",
    "app/administrar/clases/[classId]/temas/[topicId]/mapa/page.tsx",
    "app/administrar/clases/[classId]/temas/[topicId]/materiales/page.tsx",
  ];

  for (const route of routes) {
    const page = source(route);
    assert.match(page, /import \{ notFound \} from "next\/navigation"/);
    assert.match(page, /notFound\(\)/);
    assert.doesNotMatch(page, /return <h1[^>]*>[\s\S]*no encontrad/i);
  }
});

test("las historias separan preparación editorial y consumo", () => {
  const stories = source("docs/03-user-stories.md");

  assert.match(stories, /modelo editorial, no autoservicio/i);
  assert.match(stories, /US-064 Acceder como estudiante \(futuro condicionado\)/);
  assert.match(stories, /Épica 10: Calendario \(futuro condicionado\)/);
  assert.match(stories, /ADR-013/);
  assert.match(stories, /ADR-014/);
  assert.doesNotMatch(stories, /Como estudiante, quiero generar/i);
  assert.doesNotMatch(stories, /Como estudiante, quiero pegar/i);
  assert.doesNotMatch(stories, /Como estudiante, quiero crear una (materia|clase|flashcard)/i);
});
