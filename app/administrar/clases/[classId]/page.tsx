import Link from "next/link";
import { ClassDetailsForm } from "@/components/class-details-form";
import { PublicationControls } from "@/components/publication-controls";
import { requireAdmin } from "@/lib/auth";
import {
  getClass,
  getSubject,
  getTopicsForClass,
} from "@/lib/data/academic";
import {
  publicationStatusLabels,
  topicApprovalStatusLabels,
} from "@/lib/status-labels";

export default async function EditorialClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireAdmin();
  const { classId } = await params;
  const numericId = Number(classId);
  const [studyClass, topics] = await Promise.all([
    getClass(numericId),
    getTopicsForClass(numericId),
  ]);
  const subject = studyClass ? await getSubject(studyClass.subjectId) : null;

  if (!studyClass || !subject) {
    return <h1 className="text-2xl font-semibold">Clase no encontrada</h1>;
  }

  return (
    <div>
      <Link className="text-sm font-semibold text-brand" href="/administrar">
        ← Panel editorial
      </Link>
      <header className="mt-6">
        <p className="text-sm font-semibold text-success">{subject.name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{studyClass.title}</h1>
        <p className="mt-3 text-muted">
          Estado actual:{" "}
          <span className="font-semibold">
            {publicationStatusLabels[studyClass.publicationStatus]}
          </span>
        </p>
      </header>
      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl font-semibold">Información de la clase</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Corrige el título y la descripción que aparecen en la biblioteca.
        </p>
        <ClassDetailsForm
          classId={studyClass.id}
          initialDescription={studyClass.description}
          initialTitle={studyClass.title}
        />
      </section>
      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl font-semibold">Publicación</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Para publicar, cada tema necesita nueve secciones, mapa conceptual,
          al menos diez flashcards y un examen.
        </p>
        <div className="mt-5">
          <PublicationControls
            classId={studyClass.id}
            currentStatus={studyClass.publicationStatus}
          />
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Vista previa por tema</h2>
        <div className="mt-4 space-y-3">
          {topics.map((topic) => (
            <Link
              className="flex items-center justify-between rounded-xl border border-border bg-white p-4 hover:border-brand/30"
              href={`/temas/${topic.id}`}
              key={topic.id}
            >
              <span>
                <span className="font-semibold">{topic.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {topicApprovalStatusLabels[topic.approvalStatus]}
                </span>
              </span>
              <span className="text-brand">Vista previa →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
