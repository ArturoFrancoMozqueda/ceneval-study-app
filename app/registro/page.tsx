import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import { isPrivateAccessOnly } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (isPrivateAccessOnly()) {
    redirect(
      "/iniciar-sesion?message=El registro está desactivado porque esta aplicación es privada.",
    );
  }
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <AuthCard
      action={signUpAction}
      description="Crea una cuenta gratuita para guardar tu progreso."
      error={error}
      fields={
        <>
          <AuthField
            autoComplete="name"
            label="Nombre"
            name="fullName"
          />
          <AuthField
            autoComplete="email"
            label="Correo electrónico"
            name="email"
            type="email"
          />
          <AuthField
            autoComplete="new-password"
            label="Contraseña (mínimo 8 caracteres)"
            name="password"
            type="password"
          />
        </>
      }
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-brand" href="/iniciar-sesion">
            Inicia sesión
          </Link>
        </>
      }
      submitLabel="Crear cuenta"
      title="Comienza a estudiar"
    />
  );
}
