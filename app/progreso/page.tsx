import type { Metadata } from "next";
import Link from "next/link";
import { SubjectProgressOverview } from "@/components/subject-progress-overview";
import { getSubjectProgressOverview } from "@/lib/data/subject-progress";

export const metadata: Metadata = {
  title: "Progreso por materia",
  description: "Cobertura y evidencia de estudio por materia.",
};

export default async function ProgressPage() {
  const overview = await getSubjectProgressOverview();
  return (
    <div>
      <SubjectProgressOverview overview={overview} />
      <p className="mt-10 text-sm text-muted">
        ¿Quieres exportar o eliminar tus datos personales?{" "}
        <Link className="font-semibold text-brand underline" href="/cuenta">
          Ve a tu cuenta
        </Link>
        .
      </p>
    </div>
  );
}
