import { updatePasswordAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import { requireUser } from "@/lib/auth";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <AuthCard
      action={updatePasswordAction}
      description="Elige una contraseña segura de al menos 8 caracteres."
      error={error}
      fields={
        <AuthField
          autoComplete="new-password"
          label="Nueva contraseña"
          name="password"
          type="password"
        />
      }
      footer={null}
      submitLabel="Guardar contraseña"
      title="Nueva contraseña"
    />
  );
}
