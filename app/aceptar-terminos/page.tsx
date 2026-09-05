import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptTermsAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; field?: string; message?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  if (user.termsAcceptedAt) redirect("/");
  const { error, field, message } = await searchParams;

  return (
    <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-7 shadow-[0_24px_70px_rgb(23_32_51_/_0.10)] sm:p-9">
      <p className="text-sm font-semibold text-success">Último paso</p>
      <h1 className="mt-2 text-3xl font-semibold">Confirma las condiciones de acceso</h1>
      <p className="mt-4 leading-7 text-muted">
        Antes de entrar a la biblioteca, revisa y acepta los documentos que
        explican el uso del servicio y el tratamiento de tus datos.
      </p>
      {message ? (
        <p className="mt-4 rounded-xl border border-success/30 bg-success-soft p-3 text-sm font-medium text-success" role="status">
          {message}
        </p>
      ) : null}
      {error && field !== "termsAccepted" ? (
        <p className="mt-4 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <form action={acceptTermsAction} className="mt-6">
        <label className="flex items-start gap-3 text-sm leading-6" htmlFor="termsAccepted">
          <input
            aria-describedby={field === "termsAccepted" ? "termsAccepted-error" : undefined}
            aria-invalid={field === "termsAccepted" || undefined}
            className="mt-0.5 size-5 shrink-0 rounded border border-muted bg-white text-brand focus-visible:ring-2 focus-visible:ring-brand"
            id="termsAccepted"
            name="termsAccepted"
            required
            type="checkbox"
          />
          <span>
            Acepto los <Link className="font-semibold text-brand underline" href="/terminos" rel="noreferrer" target="_blank">términos de uso<span className="sr-only"> (abre en una pestaña nueva)</span></Link> y el <Link className="font-semibold text-brand underline" href="/privacidad" rel="noreferrer" target="_blank">aviso de privacidad<span className="sr-only"> (abre en una pestaña nueva)</span></Link>.
          </span>
        </label>
        {field === "termsAccepted" ? (
          <p className="mt-2 text-sm font-medium text-danger" id="termsAccepted-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" type="submit">
          Aceptar y continuar
        </button>
      </form>
    </div>
  );
}
