import type { Metadata } from "next";
import Link from "next/link";
import { FlashcardEditForm } from "@/components/flashcard-edit-form";
import { requireAdmin } from "@/lib/auth";
import { getFlashcardsForEdit } from "@/app/actions/academic";
import { getClass, getTopic } from "@/lib/data/academic";

type EditorialFlashcardsPageProps = {
  params: Promise<{ classId: string; topicId: string }>;
};

export async function generateMetadata({
  params,
}: EditorialFlashcardsPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericTopicId = Number(topicId);
  const topic = Number.isInteger(numericTopicId)
    ? await getTopic(numericTopicId)
    : null;
  return {
    title: topic
      ? `Flashcards · ${topic.title} · Panel editorial`
      : "Flashcards no encontradas · Panel editorial",
  };
}

export default async function EditorialFlashcardsPage({
  params,
}: EditorialFlashcardsPageProps) {
  await requireAdmin();
  const { classId, topicId } = await params;
  const numericClassId = Number(classId);
  const numericTopicId = Number(topicId);

  if (!Number.isInteger(numericClassId) || !Number.isInteger(numericTopicId)) {
    return <h1 className="text-2xl font-semibold">Flashcards no encontradas</h1>;
  }

  const [studyClass, topic, flashcards] = await Promise.all([
    getClass(numericClassId),
    getTopic(numericTopicId),
    getFlashcardsForEdit(numericTopicId),
  ]);

  if (!studyClass || !topic || topic.classId !== numericClassId) {
    return <h1 className="text-2xl font-semibold">Flashcards no encontradas</h1>;
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
          Editar flashcards del tema
        </h1>
        <p className="mt-3 max-w-2xl leading-6 text-muted">
          Corrige la pregunta o la respuesta de una flashcard ya publicada.
          Guardar aquí marca la clase con una revisión editorial pendiente —
          no se pierde ni se despublica nada, pero conviene volver a
          revisarla desde &quot;Publicación&quot;.
        </p>
      </header>

      {!flashcards || flashcards.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-muted">
          Este tema no tiene flashcards para editar.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {flashcards.map((flashcard) => (
            <FlashcardEditForm
              classId={numericClassId}
              flashcard={flashcard}
              key={flashcard.id}
              topicId={numericTopicId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
