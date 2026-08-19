import type { Metadata } from "next";
import { ClassDetail } from "@/components/class-detail";

export const metadata: Metadata = {
  title: "Detalle de clase",
};

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  return <ClassDetail classId={Number(classId)} />;
}
