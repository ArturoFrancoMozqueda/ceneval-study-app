import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { isPrivateAccessOnly } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Acceso privado al espacio editorial de CENEVAL Study App.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error, message } = await searchParams;

  return (
    <SignInForm
      initialError={error}
      initialMessage={message}
      privateAccessOnly={isPrivateAccessOnly()}
    />
  );
}
