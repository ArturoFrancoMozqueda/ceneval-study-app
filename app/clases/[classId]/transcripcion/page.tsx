import type { Metadata } from "next";
import {
  MissingClass,
  TranscriptWorkspace,
} from "@/components/transcript-workspace";
import {
  getClass,
  getSubject,
  getTranscript,
} from "@/lib/data/academic";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Transcripción",
};

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireAdmin();
  const { classId } = await params;
  const numericClassId = Number(classId);
  const [studyClass, transcript] = await Promise.all([
    getClass(numericClassId),
    getTranscript(numericClassId),
  ]);

  if (!studyClass) return <MissingClass />;

  const subject = await getSubject(studyClass.subjectId);
  if (!subject) return <MissingClass />;

  return (
    <TranscriptWorkspace
      studyClass={studyClass}
      subject={subject}
      transcript={transcript}
    />
  );
}
