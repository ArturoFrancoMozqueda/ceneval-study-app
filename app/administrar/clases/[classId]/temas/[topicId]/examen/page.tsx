import type { Metadata } from "next";
import Link from "next/link";
import { ExamQuestionEditForm } from "@/components/exam-question-edit-form";
import { requireAdmin } from "@/lib/auth";
import { getExamQuestionsForEdit } from "@/app/actions/academic";
import { getClass, getTopic } from "@/lib/data/academic";

type EditorialExamPageProps = {
  params: Promise<{ classId: string; topicId: string }>;
};

export async function generateMetadata({
  params,
}: EditorialExamPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericTopicId = Number(topicId);
  const topic = Number.isInteger(numericTopicId)
    ? await getTopic(numericTopicId)
    : null;
  return {
    title: topic
      ? `Examen · ${topic.title} · Panel editorial`
      : "Examen no encontrado · Panel editorial",
  };
}

export default async function EditorialExamPage({
  params,
}: EditorialExamPageProps) {
  await requireAdmin();
  const { classId, topicId } = await params;
  const numericClassId = Number(classId);
  const numericTopicId = Number(topicId);

  if (!Number.isInteger(numericClassId) || !Number.isInteger(numericTopicId)) {
    return <h1 className="text-2xl font-semibold">Examen no encontrado</h1>;
  }

  const [studyClass, topic, questions] = await Promise.all([
    getClass(numericClassId),
    getTopic(numericTopicId),
    getExamQuestionsForEdit(numericTopicId),
  ]);

  if (!studyClass || !topic || topic.classId !== numericClassId) {
    return <h1 className="text-2xl font-semibold">Examen no encontrado</h1>;
  }

  return (
    <div>
      <Link
        className="text-sm font-semibold text-brand"
        href={`/administrar/clases/${numericClassId}`}
      >
        ← {studyClass.title}
      </Link>
      <header className="mt-6">
        <p className="text-sm font-semibold text-success">{topic.title}</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Editar examen del tema
        </h1>
        <p className="mt-3 max-w-2xl leading-6 text-muted">
          Corrige el texto, las opciones o las explicaciones de una pregunta
          ya publicada. Guardar aquí marca la clase con una revisión editorial
          pendiente — no se pierde ni se despublica nada, pero conviene
          volver a revisarla desde &quot;Publicación&quot;.
        </p>
      </header>

      {!questions || questions.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-muted">
          Este tema no tiene un examen vigente con preguntas para editar.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {questions.map((question) => (
            <ExamQuestionEditForm
              classId={numericClassId}
              key={question.id}
              question={question}
              topicId={numericTopicId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
