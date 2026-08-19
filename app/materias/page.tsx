import type { Metadata } from "next";
import { SubjectsList } from "@/components/subjects-list";

export const metadata: Metadata = {
  title: "Mis materias",
};

export default function SubjectsPage() {
  return <SubjectsList />;
}
