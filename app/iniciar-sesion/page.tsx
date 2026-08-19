import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import { isPrivateAccessOnly } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error, message } = await searchParams;

  return (
    <AuthCard
      action={signInAction}
      description="Entra a tu biblioteca y continúa tu preparación."
      error={error}
      fields={
        <>
          <AuthField
            autoComplete="email"
            label="Correo electrónico"
            name="email"
            type="email"
          />
          <AuthField
            autoComplete="current-password"
            label="Contraseña"
            name="password"
            type="password"
          />
          <div className="text-right">
            <Link
              className="text-sm font-semibold text-brand"
              href="/recuperar-contrasena"
            >
              Olvidé mi contraseña
            </Link>
          </div>
        </>
      }
      footer={
        isPrivateAccessOnly() ? (
          <>Acceso privado para la administradora.</>
        ) : (
          <>
            ¿Aún no tienes cuenta?{" "}
            <Link className="font-semibold text-brand" href="/registro">
              Regístrate
            </Link>
          </>
        )
      }
      message={message}
      submitLabel="Iniciar sesión"
      title="Bienvenida de nuevo"
    />
  );
}
