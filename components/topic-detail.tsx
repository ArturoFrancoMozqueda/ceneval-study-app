import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import {
  getLessonBundle,
  getStudyContinuation,
  getStudyProgress,
} from "@/lib/data/academic";

export async function TopicDetail({ topicId }: { topicId: number }) {
  const [lesson, progress, continuation] = await Promise.all([
    getLessonBundle(topicId),
    getStudyProgress(topicId),
    getStudyContinuation(topicId),
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
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {lesson.topic.description}
        </p>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Material educativo para preparación académica; no constituye asesoría
          jurídica.
        </p>
      </header>
      <LessonView
        continuation={continuation}
        initialProgress={progress}
        lesson={lesson}
      />
    </div>
  );
}
