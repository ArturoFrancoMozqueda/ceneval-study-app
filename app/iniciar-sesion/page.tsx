import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { getCurrentUser } from "@/lib/auth";

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
    />
  );
}
