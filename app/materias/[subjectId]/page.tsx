import type { Metadata } from "next";
import { SubjectDetail } from "@/components/subject-detail";

export const metadata: Metadata = {
  title: "Detalle de materia",
};

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const numericSubjectId = Number(subjectId);

  return <SubjectDetail subjectId={numericSubjectId} />;
}
