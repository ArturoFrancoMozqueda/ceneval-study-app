import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-7 shadow-[0_24px_70px_rgb(23_32_51_/_0.10)] sm:p-9">
      <p className="text-sm font-semibold text-success">Acceso por invitación</p>
      <h1 className="mt-2 text-3xl font-semibold">El registro aún no está abierto</h1>
      <p className="mt-4 leading-7 text-muted">
        Esta página no recopila datos ni crea solicitudes de acceso. Si ya
        recibiste una invitación, usa el correo asociado a tu cuenta para
        iniciar sesión.
      </p>
      {error ? (
        <p
          className="mt-4 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white"
          href="/iniciar-sesion"
        >
          Iniciar sesión
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold text-brand"
          href="/muestra"
        >
          Ver la muestra gratuita
        </Link>
      </div>
    </div>
  );
}
