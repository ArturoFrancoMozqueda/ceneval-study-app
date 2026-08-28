import Link from "next/link";
import { notFound } from "next/navigation";
import { AdaptivePractice } from "@/components/adaptive-practice";
import { ExamPlayer } from "@/components/exam-player";
import { LessonView } from "@/components/lesson-view";
import { ProtectedText } from "@/components/protected-text";
import {
  getLessonBundle,
  getStudyProgress,
} from "@/lib/data/academic";

export type StudyMode = "practicar" | "leccion" | "simulacro";

const modeCopy: Record<StudyMode, { label: string; description: string }> = {
  practicar: {
    label: "Practicar",
    description: "Recupera, contrasta y ajusta en una ronda breve.",
  },
  leccion: {
    label: "Consultar la lección",
    description: "Vuelve a la explicación, el mapa y los casos.",
  },
  simulacro: {
    label: "Hacer simulacro",
    description: "Responde sin pistas y revisa al entregar.",
  },
};

export async function TopicDetail({
  topicId,
  mode,
}: {
  topicId: number;
  mode: StudyMode;
}) {
  const [lesson, progress] = await Promise.all([
    getLessonBundle(topicId),
    getStudyProgress(topicId),
  ]);

  if (!lesson) notFound();

  return (
    <div>
      <nav aria-label="Migas de navegación">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <li>
            <Link className="hover:text-brand" href="/materias">
              Biblioteca
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="hover:text-brand"
              href={`/clases/${lesson.studyClass.id}`}
            >
              {lesson.studyClass.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{lesson.topic.title}</li>
        </ol>
      </nav>
      <header className="mt-7">
        <p className="text-sm font-semibold text-success">
          {lesson.subject.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {lesson.topic.title}
        </h1>
        <ProtectedText as="p" className="mt-3 max-w-3xl leading-7 text-muted">
          {lesson.topic.description}
        </ProtectedText>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Material educativo para preparación académica; no constituye asesoría
          jurídica.
        </p>
      </header>

      <nav aria-label="Modo de estudio" className="mt-8">
        <ul className="grid gap-3 md:grid-cols-3">
          {(Object.entries(modeCopy) as Array<[StudyMode, (typeof modeCopy)[StudyMode]]>).map(
            ([value, copy]) => {
              const active = mode === value;
              const href =
                value === "practicar"
                  ? `/temas/${topicId}`
                  : `/temas/${topicId}?modo=${value}`;
              return (
                <li key={value}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`block min-h-28 rounded-2xl border p-5 ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white hover:border-brand/35"
                    }`}
                    href={href}
                  >
                    <span className="block font-semibold">{copy.label}</span>
                    <span className={`mt-2 block text-sm leading-6 ${active ? "text-white/75" : "text-muted"}`}>
                      {copy.description}
                    </span>
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </nav>

      {mode === "practicar" ? (
        <section aria-labelledby="practice-title" className="mt-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm font-semibold text-success">Práctica guiada</p>
            <h2 className="mt-2 text-3xl" id="practice-title">
              Primero intenta; después mira la clave
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Tu borrador no se guarda ni se califica automáticamente. La confianza y
              tu autoevaluación ayudan a decidir qué volverá a aparecer.
            </p>
          </div>
          <AdaptivePractice
            cards={lesson.flashcards}
            completionHref={`/temas/${topicId}?modo=simulacro`}
            topicId={topicId}
          />
        </section>
      ) : null}

      {mode === "leccion" ? (
        <LessonView
          initialProgress={progress}
          lesson={lesson}
        />
      ) : null}

      {mode === "simulacro" ? (
        <section aria-labelledby="simulation-title" className="mt-8">
          <div className="mb-6 rounded-3xl border border-border bg-white p-6 sm:p-8">
            <p className="text-sm font-semibold text-success">Simulacro del tema</p>
            <h2 className="mt-2 text-3xl" id="simulation-title">
              Responde sin retroalimentación intermedia
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Aquí practicamos las condiciones del examen: verás la revisión y las
              explicaciones solo después de entregar todas las respuestas.
            </p>
          </div>
          {lesson.exam ? (
            <ExamPlayer exam={lesson.exam} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-muted">
              El simulacro de este tema todavía no está disponible.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
