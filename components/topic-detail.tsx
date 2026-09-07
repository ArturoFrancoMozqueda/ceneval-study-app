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

const modeCopy: Record<StudyMode, { label: string }> = {
  leccion: {
    label: "Estudiar el tema",
  },
  practicar: {
    label: "Practicar",
  },
  simulacro: {
    label: "Simulacro",
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
        <details className="mt-3 text-sm text-muted">
          <summary className="min-h-11 cursor-pointer py-3 font-semibold text-brand">Acerca de este tema</summary>
          <ProtectedText as="p" className="max-w-3xl leading-7">
            {lesson.topic.description}
          </ProtectedText>
        </details>
      </header>

      <nav aria-label="Modo de estudio" className="mt-4">
        <ul className="grid grid-cols-3 gap-2">
          {(Object.entries(modeCopy) as Array<[StudyMode, (typeof modeCopy)[StudyMode]]>).map(
            ([value, copy]) => {
              const active = mode === value;
              const href =
                value === "leccion"
                  ? `/temas/${topicId}`
                  : `/temas/${topicId}?modo=${value}`;
              return (
                <li key={value}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center justify-center rounded-xl border px-2 py-3 text-center text-sm ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white hover:border-brand/35"
                    }`}
                    href={href}
                  >
                    <span className="block font-semibold">{copy.label}</span>
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </nav>

      {mode === "practicar" ? (
        <section aria-labelledby="practice-title" className="mt-8">
          <h2 className="sr-only" id="practice-title">Práctica guiada</h2>
          <p className="mb-5 max-w-3xl text-sm leading-6 text-muted">
            Intenta responder y luego compara. Tu borrador no se guarda ni se califica
            automáticamente; tú valoras qué acertaste.
          </p>
          <AdaptivePractice
            key={topicId}
            cards={lesson.flashcards}
            completionHref={`/temas/${topicId}?modo=simulacro`}
            topicId={topicId}
          />
        </section>
      ) : null}

      {mode === "leccion" ? (
        <LessonView
          key={topicId}
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
            <ExamPlayer key={lesson.exam.id} exam={lesson.exam} topicId={topicId} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-muted">
              El simulacro de este tema todavía no está disponible.
            </p>
          )}
        </section>
      ) : null}
      <p className="mt-8 text-xs leading-6 text-muted">
        Material educativo para preparación académica; no constituye asesoría jurídica.
      </p>
    </div>
  );
}
