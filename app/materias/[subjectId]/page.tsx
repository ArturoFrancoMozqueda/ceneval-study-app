import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectDetail } from "@/components/subject-detail";
import { getSubject } from "@/lib/data/academic";

type SubjectPageProps = {
  params: Promise<{ subjectId: string }>;
};

export async function generateMetadata({
  params,
}: SubjectPageProps): Promise<Metadata> {
  const { subjectId } = await params;
  const numericId = Number(subjectId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    return { title: "Materia no encontrada" };
  }

  const subject = await getSubject(numericId);
  return {
    title: subject?.name || "Materia no encontrada",
    description: subject?.description || undefined,
  };
}

export default async function SubjectDetailPage({
  params,
}: SubjectPageProps) {
  const { subjectId } = await params;
  const numericSubjectId = Number(subjectId);
  if (!Number.isInteger(numericSubjectId) || numericSubjectId < 1) notFound();

  return <SubjectDetail subjectId={numericSubjectId} />;
}
