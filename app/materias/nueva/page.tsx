import type { Metadata } from "next";
import Link from "next/link";
import { SubjectForm } from "@/components/subject-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nueva materia",
};

export default async function NewSubjectPage() {
  await requireAdmin();
  return (
    <div>
      <nav aria-label="Migas de navegación">
        <ol className="flex items-center gap-2 text-sm text-muted">
          <li>
            <Link className="hover:text-brand" href="/materias">
              Materias
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Nueva materia</li>
        </ol>
      </nav>
      <header className="mt-6">
        <p className="text-sm font-semibold text-success">Organiza tu estudio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Nueva materia
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Empieza con el nombre. Después podrás agregar clases y organizar sus
          temas editoriales.
        </p>
      </header>
      <SubjectForm />
    </div>
  );
}
