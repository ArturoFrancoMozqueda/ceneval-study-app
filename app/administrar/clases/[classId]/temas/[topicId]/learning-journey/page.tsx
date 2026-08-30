import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicLearningJourneyEditForm } from "@/components/topic-learning-journey-edit-form";
import { requireAdmin } from "@/lib/auth";
import { getTopicLearningJourneyForEdit } from "@/app/actions/academic";
import { getClass, getTopic } from "@/lib/data/academic";

type EditorialLearningJourneyPageProps = {
  params: Promise<{ classId: string; topicId: string }>;
};

export async function generateMetadata({
  params,
}: EditorialLearningJourneyPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericTopicId = Number(topicId);
  const topic = Number.isInteger(numericTopicId)
    ? await getTopic(numericTopicId)
    : null;
  return {
    title: topic
      ? `Explicación · ${topic.title} · Panel editorial`
      : "Explicación no encontrada · Panel editorial",
  };
}

export default async function EditorialLearningJourneyPage({
  params,
}: EditorialLearningJourneyPageProps) {
  await requireAdmin();
  const { classId, topicId } = await params;
  const numericClassId = Number(classId);
  const numericTopicId = Number(topicId);

  if (
    !Number.isInteger(numericClassId) || numericClassId < 1 ||
    !Number.isInteger(numericTopicId) || numericTopicId < 1
  ) notFound();

  const [studyClass, topic, journey] = await Promise.all([
    getClass(numericClassId),
    getTopic(numericTopicId),
    getTopicLearningJourneyForEdit(numericTopicId),
  ]);

  if (!studyClass || !topic || topic.classId !== numericClassId) notFound();

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
          Editar explicación del tema
        </h1>
        <p className="mt-3 max-w-2xl leading-6 text-muted">
          Corrige el prompt de apertura, los quick checks, el caso práctico,
          el cierre o la siguiente actividad de este tema ya publicado.
          Guardar aquí marca la clase con una revisión editorial pendiente —
          no se pierde ni se despublica nada, pero conviene volver a
          revisarla desde &quot;Publicación&quot;.
        </p>
      </header>

      {!journey ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-muted">
          Este tema no tiene una explicación (learning journey) para editar.
        </p>
      ) : (
        <div className="mt-8">
          <TopicLearningJourneyEditForm
            classId={numericClassId}
            journey={journey}
            topicId={numericTopicId}
          />
        </div>
      )}
    </div>
  );
}
