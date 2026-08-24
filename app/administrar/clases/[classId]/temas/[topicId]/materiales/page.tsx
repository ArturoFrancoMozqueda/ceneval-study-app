import type { Metadata } from "next";
import Link from "next/link";
import { StudyMaterialEditForm } from "@/components/study-material-edit-form";
import { requireAdmin } from "@/lib/auth";
import { getStudyMaterialsForEdit } from "@/app/actions/academic";
import { getClass, getTopic } from "@/lib/data/academic";

type EditorialMaterialsPageProps = {
  params: Promise<{ classId: string; topicId: string }>;
};

export async function generateMetadata({
  params,
}: EditorialMaterialsPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericTopicId = Number(topicId);
  const topic = Number.isInteger(numericTopicId)
    ? await getTopic(numericTopicId)
    : null;
  return {
    title: topic
      ? `Materiales · ${topic.title} · Panel editorial`
      : "Materiales no encontrados · Panel editorial",
  };
}

export default async function EditorialMaterialsPage({
  params,
}: EditorialMaterialsPageProps) {
  await requireAdmin();
  const { classId, topicId } = await params;
  const numericClassId = Number(classId);
  const numericTopicId = Number(topicId);

  if (!Number.isInteger(numericClassId) || !Number.isInteger(numericTopicId)) {
    return <h1 className="text-2xl font-semibold">Materiales no encontrados</h1>;
  }

  const [studyClass, topic, materials] = await Promise.all([
    getClass(numericClassId),
    getTopic(numericTopicId),
    getStudyMaterialsForEdit(numericTopicId),
  ]);

  if (!studyClass || !topic || topic.classId !== numericClassId) {
    return <h1 className="text-2xl font-semibold">Materiales no encontrados</h1>;
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
          Editar materiales del tema
        </h1>
        <p className="mt-3 max-w-2xl leading-6 text-muted">
          Corrige el título o el contenido de un material ya publicado.
          Guardar aquí crea una versión nueva del material y marca la clase
          con una revisión editorial pendiente — no se pierde ni se
          despublica nada, pero la evidencia vinculada a la versión anterior
          deja de contar para la validación de completitud hasta que se
          vuelva a vincular a la versión nueva. Conviene volver a revisar la
          clase desde &quot;Publicación&quot;.
        </p>
      </header>

      {!materials || materials.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-muted">
          Este tema no tiene materiales para editar.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {materials.map((material) => (
            <StudyMaterialEditForm
              classId={numericClassId}
              key={material.id}
              material={material}
              topicId={numericTopicId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
