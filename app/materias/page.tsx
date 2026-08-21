import type { Metadata } from "next";
import { SubjectsList } from "@/components/subjects-list";

export const metadata: Metadata = {
  title: "Biblioteca de Derecho",
};

export default function SubjectsPage() {
  return <SubjectsList />;
}
