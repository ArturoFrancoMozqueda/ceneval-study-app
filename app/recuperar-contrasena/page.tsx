import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      action={requestPasswordResetAction}
      description="Te enviaremos un enlace seguro para elegir una contraseña nueva."
      error={error}
      fields={
        <AuthField
          autoComplete="email"
          label="Correo electrónico"
          name="email"
          type="email"
        />
      }
      footer={
        <Link className="font-semibold text-brand" href="/iniciar-sesion">
          Volver a iniciar sesión
        </Link>
      }
      submitLabel="Enviar enlace"
      title="Recupera tu cuenta"
    />
  );
}
