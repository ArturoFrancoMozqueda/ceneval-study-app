import type { Metadata } from "next";
import { TopicDetail } from "@/components/topic-detail";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Detalle de tema",
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  await requireUser();
  const { topicId } = await params;

  return <TopicDetail topicId={Number(topicId)} />;
}
