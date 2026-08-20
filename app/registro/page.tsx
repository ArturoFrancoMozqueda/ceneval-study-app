import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import { isPrivateAccessOnly } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; field?: string }>;
}) {
  if (isPrivateAccessOnly()) {
    redirect(
      "/iniciar-sesion?message=El registro está desactivado porque esta aplicación es privada.",
    );
  }
  if (await getCurrentUser()) redirect("/");
  const { error, field } = await searchParams;

  return (
    <AuthCard
      action={signUpAction}
      description="Crea una cuenta gratuita para guardar tu progreso."
      error={field ? undefined : error}
      fields={
        <>
          <AuthField
            autoComplete="name"
            description="Escribe cómo quieres que aparezca tu nombre."
            error={field === "fullName" ? error : undefined}
            label="Nombre"
            name="fullName"
          />
          <AuthField
            autoComplete="email"
            description="Usa un correo al que tengas acceso."
            error={field === "email" ? error : undefined}
            label="Correo electrónico"
            name="email"
            type="email"
          />
          <AuthField
            autoComplete="new-password"
            description="Usa al menos 8 caracteres; puedes apoyarte en un gestor de contraseñas."
            error={field === "password" ? error : undefined}
            label="Contraseña"
            name="password"
            type="password"
          />
        </>
      }
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            className="inline-flex min-h-11 items-center font-semibold text-brand"
            href="/iniciar-sesion"
          >
            Inicia sesión
          </Link>
        </>
      }
      submitLabel="Crear cuenta"
      title="Comienza a estudiar"
    />
  );
}
