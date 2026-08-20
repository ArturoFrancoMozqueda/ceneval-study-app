import type { Metadata } from "next";
import { ClassDetail } from "@/components/class-detail";
import { getClass } from "@/lib/data/academic";

type ClassPageProps = {
  params: Promise<{ classId: string }>;
};

export async function generateMetadata({
  params,
}: ClassPageProps): Promise<Metadata> {
  const { classId } = await params;
  const numericId = Number(classId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    return { title: "Clase no encontrada" };
  }

  const studyClass = await getClass(numericId);
  return {
    title: studyClass?.curriculumCode
      ? `${studyClass.curriculumCode} · ${studyClass.title}`
      : studyClass?.title || "Clase no encontrada",
    description: studyClass?.description || undefined,
  };
}

export default async function ClassDetailPage({
  params,
}: ClassPageProps) {
  const { classId } = await params;

  return <ClassDetail classId={Number(classId)} />;
}
