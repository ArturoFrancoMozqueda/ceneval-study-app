import type { Metadata } from "next";
import Link from "next/link";
import { TopicsReview } from "@/components/topics-review";
import {
  getClass,
  getSubject,
  getTopicsForClass,
} from "@/lib/data/academic";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Revisión de temas",
};

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireAdmin();
  const { classId } = await params;
  const numericClassId = Number(classId);
  const [studyClass, topics] = await Promise.all([
    getClass(numericClassId),
    getTopicsForClass(numericClassId),
  ]);

  if (!studyClass) return <MissingTopicsContext />;
  const subject = await getSubject(studyClass.subjectId);
  if (!subject) return <MissingTopicsContext />;

  return (
    <TopicsReview
      studyClass={studyClass}
      subject={subject}
      topics={topics}
    />
  );
}

function MissingTopicsContext() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8">
      <h1 className="text-2xl font-semibold">Clase no encontrada</h1>
      <Link className="mt-5 inline-flex text-brand" href="/materias">
        Volver a materias
      </Link>
    </section>
  );
}
