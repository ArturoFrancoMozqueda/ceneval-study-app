import type { Metadata } from "next";
import { SubjectProgressOverview } from "@/components/subject-progress-overview";
import { getSubjectProgressOverview } from "@/lib/data/subject-progress";

export const metadata: Metadata = {
  title: "Progreso por materia",
  description: "Cobertura y evidencia de estudio por materia.",
};

export default async function ProgressPage() {
  const overview = await getSubjectProgressOverview();
  return <SubjectProgressOverview overview={overview} />;
}
