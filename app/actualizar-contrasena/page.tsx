import { updatePasswordAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import { requireUser } from "@/lib/auth";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; field?: string }>;
}) {
  await requireUser();
  const { error, field } = await searchParams;

  return (
    <AuthCard
      action={updatePasswordAction}
      description="Elige una contraseña segura de 12 a 128 caracteres."
      error={field ? undefined : error}
      fields={
        <AuthField
          autoComplete="new-password"
          description="Incluye al menos una letra y un número; puedes apoyarte en un gestor de contraseñas."
          error={field === "password" ? error : undefined}
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
