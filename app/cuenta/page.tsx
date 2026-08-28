import type { Metadata } from "next";
import Link from "next/link";
import {
  deleteAccountAction,
  updateExamTargetDateAction,
} from "@/app/actions/account";
import { requireUser } from "@/lib/auth";
import { writeDependencyFailure } from "@/lib/operations/safe-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tu cuenta",
  description: "Consulta y exporta los datos personales de tu cuenta de Sube Legal.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { error, saved } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("exam_target_date")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    writeDependencyFailure({ error: profileError, operation: "AccountPage.profile" });
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-success">Tu cuenta</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Datos y privacidad
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Aquí puedes descargar los datos personales asociados a tu cuenta{" "}
        <strong className="text-foreground">{user.email}</strong>
        {user.role === "student"
          ? " o solicitar que se elimine de forma permanente"
          : " y revisar cómo se protege tu información"}
        , conforme a nuestro{" "}
        <Link className="font-semibold text-brand underline" href="/privacidad">
          aviso de privacidad
        </Link>
        .
      </p>

      {error ? (
        <p
          className="mt-5 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p
          className="mt-5 rounded-xl border border-success/30 bg-success-soft p-3 text-sm font-medium text-success"
          role="status"
        >
          {saved}
        </p>
      ) : null}

      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgb(23_32_51_/_0.06)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Fecha objetivo del examen
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Es opcional. Si la agregas, spacing-v1 puede acortar algunos
          intervalos conforme se acerca la fecha. Es una heurística de
          planificación, no una recomendación científicamente validada ni una
          garantía de aprendizaje o resultado.
        </p>
        <form action={updateExamTargetDateAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Fecha del examen
            <input
              className="min-h-11 rounded-xl border border-border bg-white px-3 text-base font-normal"
              defaultValue={profile?.exam_target_date ?? ""}
              name="examTargetDate"
              type="date"
            />
          </label>
          <button
            className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
            type="submit"
          >
            Guardar fecha
          </button>
          {profile?.exam_target_date ? (
            <button
              className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-surface-soft"
              name="intent"
              type="submit"
              value="clear"
            >
              Quitar fecha
            </button>
          ) : null}
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgb(23_32_51_/_0.06)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Exportar mis datos
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Descarga un archivo JSON con tu perfil, tu progreso por tema, tus
          intentos de examen y las respuestas que seleccionaste en cada uno.
          No incluye las claves de respuesta correctas del examen: esa
          información nunca se expone fuera del servidor.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
          href="/api/cuenta/exportar"
        >
          Descargar mis datos (JSON)
        </a>
      </section>

      {user.role === "student" ? (
      <section className="mt-6 rounded-3xl border border-danger/25 bg-danger-soft/40 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-danger">
          Eliminar mi cuenta
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/80">
          Esta acción es permanente: se elimina tu cuenta, tu perfil, tu
          progreso, tus intentos de examen y tus respuestas. No podemos
          recuperar esta información después de eliminarla. Si tienes una
          suscripción activa, cancélala antes o escríbenos a{" "}
          <a
            className="font-semibold text-brand underline"
            href="mailto:soporte@sube-legal.mx"
          >
            soporte@sube-legal.mx
          </a>
          .
        </p>
        <form action={deleteAccountAction} className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-sm leading-6 text-foreground">
            <input
              className="mt-0.5 size-5 shrink-0 rounded border border-danger bg-white text-danger focus-visible:ring-2 focus-visible:ring-danger"
              name="confirmDeletion"
              required
              type="checkbox"
            />
            <span>
              Entiendo que eliminar mi cuenta es permanente y que perderé mi
              acceso y mi progreso.
            </span>
          </label>
          <button
            className="min-h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-white hover:opacity-90"
            type="submit"
          >
            Eliminar mi cuenta definitivamente
          </button>
        </form>
      </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Cuenta administradora protegida
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Esta cuenta no se puede eliminar desde la aplicación porque podría
            dejar el proyecto sin acceso administrativo. Si necesitas
            reemplazarla, sigue el procedimiento operativo de administración.
          </p>
        </section>
      )}

      <p className="mt-6 text-sm text-muted">
        Consulta también los{" "}
        <Link className="font-semibold text-brand underline" href="/terminos">
          términos de uso
        </Link>
        .
      </p>
    </div>
  );
}
