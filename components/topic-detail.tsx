import Link from "next/link";
import { LessonView } from "@/components/lesson-view";
import { getLessonBundle, getStudyProgress } from "@/lib/data/academic";

export async function TopicDetail({ topicId }: { topicId: number }) {
  const [lesson, progress] = await Promise.all([
    getLessonBundle(topicId),
    getStudyProgress(topicId),
  ]);

  if (!lesson) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-2xl font-semibold">Tema no disponible</h1>
        <p className="mt-2 text-muted">
          Puede que todavía sea un borrador o que no exista.
        </p>
        <Link className="mt-5 inline-flex text-brand" href="/materias">
          Volver a la biblioteca
        </Link>
      </section>
    );
  }

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
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {lesson.topic.description}
        </p>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Material educativo para preparación académica; no constituye asesoría
          jurídica.
        </p>
      </header>
      <LessonView initialProgress={progress} lesson={lesson} />
    </div>
  );
}
