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
  if (await getCurrentUser()) redirect("/");
  const { error, field } = await searchParams;

  if (isPrivateAccessOnly()) {
    return (
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-7 shadow-[0_24px_70px_rgb(23_32_51_/_0.10)] sm:p-9">
        <p className="text-sm font-semibold text-success">Acceso privado</p>
        <h1 className="mt-2 text-3xl font-semibold">El registro aún no está abierto</h1>
        <p className="mt-4 leading-7 text-muted">
          Sube Legal sigue en una etapa privada de revisión. Esta página no
          recopila datos ni crea solicitudes de acceso. Cuando el registro
          público esté listo, lo anunciaremos en el sitio.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white" href="/muestra">
            Ver la muestra gratuita
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold text-brand" href="/iniciar-sesion">
            Ya tengo acceso
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      action={signUpAction}
      description="Crea una cuenta con tu correo para guardar tu progreso de estudio."
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
            description="Usa de 12 a 128 caracteres e incluye al menos una letra y un número. Puedes apoyarte en un gestor de contraseñas."
            error={field === "password" ? error : undefined}
            label="Contraseña"
            name="password"
            type="password"
          />
          <div>
            <label
              className="flex items-start gap-3 text-sm leading-6"
              htmlFor="termsAccepted"
            >
              <input
                aria-describedby={
                  field === "termsAccepted" ? "termsAccepted-error" : undefined
                }
                aria-invalid={field === "termsAccepted" || undefined}
                className={`mt-0.5 size-5 shrink-0 rounded border bg-white text-brand focus-visible:ring-2 focus-visible:ring-brand ${
                  field === "termsAccepted" ? "border-danger" : "border-muted"
                }`}
                id="termsAccepted"
                name="termsAccepted"
                required
                type="checkbox"
              />
              <span>
                Acepto los{" "}
                <Link
                  className="font-semibold text-brand underline"
                  href="/terminos"
                  target="_blank"
                >
                  términos de uso
                </Link>{" "}
                y el{" "}
                <Link
                  className="font-semibold text-brand underline"
                  href="/privacidad"
                  target="_blank"
                >
                  aviso de privacidad
                </Link>
                .
              </span>
            </label>
            {field === "termsAccepted" ? (
              <p
                className="mt-2 text-sm font-medium text-danger"
                id="termsAccepted-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
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
      title="Crea tu cuenta"
    />
  );
}
