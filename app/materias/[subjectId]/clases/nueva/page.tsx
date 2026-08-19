import type { Metadata } from "next";
import Link from "next/link";
import { ClassForm } from "@/components/class-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nueva clase",
};

export default async function NewClassPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  await requireAdmin();
  const { subjectId } = await params;
  const numericSubjectId = Number(subjectId);

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
          <li>
            <Link
              className="hover:text-brand"
              href={`/materias/${subjectId}`}
            >
              Detalle
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Nueva clase</li>
        </ol>
      </nav>
      <header className="mt-6">
        <p className="text-sm font-semibold text-success">Organiza tu materia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Nueva clase
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Registra la clase ahora y agrega su transcripción en el siguiente
          paso.
        </p>
      </header>
      <ClassForm subjectId={numericSubjectId} />
    </div>
  );
}
