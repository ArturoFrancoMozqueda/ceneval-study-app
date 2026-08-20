import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; field?: string }>;
}) {
  const { error, field } = await searchParams;
  const emailError = field === "email" ? error : undefined;

  return (
    <AuthCard
      action={requestPasswordResetAction}
      description="Te enviaremos un enlace seguro para elegir una contraseña nueva."
      error={field ? undefined : error}
      fields={
        <AuthField
          autoComplete="email"
          description="Usa el correo asociado a tu cuenta."
          error={emailError}
          label="Correo electrónico"
          name="email"
          type="email"
        />
      }
      footer={
        <Link
          className="inline-flex min-h-11 items-center font-semibold text-brand"
          href="/iniciar-sesion"
        >
          Volver a iniciar sesión
        </Link>
      }
      submitLabel="Enviar enlace"
      title="Recupera tu cuenta"
    />
  );
}
