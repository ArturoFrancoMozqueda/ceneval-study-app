import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptMapEditForm } from "@/components/concept-map-edit-form";
import { requireAdmin } from "@/lib/auth";
import { getConceptMapForEdit } from "@/app/actions/academic";
import { getClass, getTopic } from "@/lib/data/academic";

type EditorialConceptMapPageProps = {
  params: Promise<{ classId: string; topicId: string }>;
};

export async function generateMetadata({
  params,
}: EditorialConceptMapPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericTopicId = Number(topicId);
  const topic = Number.isInteger(numericTopicId)
    ? await getTopic(numericTopicId)
    : null;
  return {
    title: topic
      ? `Mapa conceptual · ${topic.title} · Panel editorial`
      : "Mapa conceptual no encontrado · Panel editorial",
  };
}

export default async function EditorialConceptMapPage({
  params,
}: EditorialConceptMapPageProps) {
  await requireAdmin();
  const { classId, topicId } = await params;
  const numericClassId = Number(classId);
  const numericTopicId = Number(topicId);

  if (
    !Number.isInteger(numericClassId) || numericClassId < 1 ||
    !Number.isInteger(numericTopicId) || numericTopicId < 1
  ) notFound();

  const [studyClass, topic, conceptMap] = await Promise.all([
    getClass(numericClassId),
    getTopic(numericTopicId),
    getConceptMapForEdit(numericTopicId),
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
          Editar mapa conceptual del tema
        </h1>
        <p className="mt-3 max-w-2xl leading-6 text-muted">
          Corrige el título, la descripción o los nodos del mapa conceptual
          ya publicado. Guardar aquí crea una versión nueva del mapa y marca
          la clase con una revisión editorial pendiente — no se pierde ni se
          despublica nada, pero la evidencia vinculada a la versión anterior
          deja de contar para la validación de completitud hasta que se
          vuelva a vincular a la versión nueva. Conviene volver a revisar la
          clase desde &quot;Publicación&quot;.
        </p>
      </header>

      {!conceptMap ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-muted">
          Este tema no tiene un mapa conceptual para editar.
        </p>
      ) : (
        <div className="mt-8">
          <ConceptMapEditForm
            classId={numericClassId}
            conceptMap={conceptMap}
            topicId={numericTopicId}
          />
        </div>
      )}
    </div>
  );
}
