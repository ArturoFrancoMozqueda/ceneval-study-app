import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicDetail } from "@/components/topic-detail";
import { requireUser } from "@/lib/auth";
import { getTopic } from "@/lib/data/academic";

type TopicPageProps = {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ modo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const numericId = Number(topicId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    return { title: "Tema no encontrado" };
  }

  const topic = await getTopic(numericId);
  return {
    title: topic?.title || "Tema no encontrado",
    description: topic?.description || undefined,
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: TopicPageProps) {
  await requireUser();
  const { topicId } = await params;
  const { modo: rawMode } = await searchParams;
  const numericId = Number(topicId);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();

  const requestedMode = Array.isArray(rawMode) ? rawMode[0] : rawMode;
  const mode =
    requestedMode === "leccion" || requestedMode === "simulacro"
      ? requestedMode
      : "practicar";

  return <TopicDetail mode={mode} topicId={numericId} />;
}
