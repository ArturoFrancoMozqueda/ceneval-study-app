import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubjectForm } from "@/components/subject-form";
import { requireAdmin } from "@/lib/auth";
import { getSubject } from "@/lib/data/academic";

export const metadata: Metadata = {
  title: "Editar materia",
};

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  await requireAdmin();
  const { subjectId } = await params;
  const numericSubjectId = Number(subjectId);
  if (!Number.isInteger(numericSubjectId) || numericSubjectId < 1) notFound();

  const subject = await getSubject(numericSubjectId);
  if (!subject) notFound();

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
              href={`/materias/${subject.id}`}
            >
              {subject.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Editar</li>
        </ol>
      </nav>
      <header className="mt-6">
        <p className="text-sm font-semibold text-success">Panel editorial</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Editar materia
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Corrige el nombre o la descripción que aparecen en la biblioteca. Las
          clases y sus materiales no cambian.
        </p>
      </header>
      <SubjectForm
        initialSubject={{
          id: subject.id,
          name: subject.name,
          description: subject.description,
        }}
      />
    </div>
  );
}
