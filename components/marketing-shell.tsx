import Link from "next/link";
import type { ReactNode } from "react";
import { isPrivateAccessOnly } from "@/lib/access";

const publicNavigation = [
  { href: "/precios", label: "Precios" },
  { href: "/muestra", label: "Muestra gratuita" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];

function MarketingBrand() {
  return (
    <Link className="group flex items-center gap-3 rounded-xl" href="/">
      <span className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold tracking-tight text-white shadow-sm transition-transform group-hover:-rotate-2">
        SL
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-tight text-foreground">
          Sube Legal
        </span>
        <span className="block text-xs text-muted">
          Biblioteca para el CENEVAL EGEL de Derecho
        </span>
      </span>
      <span className="sr-only">, ir al inicio</span>
    </Link>
  );
}

/**
 * Envoltura pública compartida por la raíz sin sesión y por las páginas de
 * marketing (/precios, /muestra, /preguntas-frecuentes). No requiere
 * autenticación ni depende de `AppShell`: `components/app-shell.tsx` deja
 * pasar estas rutas sin la barra lateral de la app autenticada.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  const privateAccessOnly = isPrivateAccessOnly();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-5 sm:px-8 lg:px-10">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-foreground px-4 py-3 font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
        href="#contenido-principal"
      >
        Saltar al contenido principal
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <MarketingBrand />
        <nav
          aria-label="Navegación pública"
          className="flex flex-wrap items-center gap-1.5 sm:gap-3"
        >
          {publicNavigation.map(({ href, label }) => (
            <Link
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            href="/iniciar-sesion"
          >
            Iniciar sesión
          </Link>
          <Link
            className="ml-1 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-deep"
            href="/iniciar-sesion"
          >
            {privateAccessOnly ? "Acceso privado" : "Iniciar sesión"}
          </Link>
        </nav>
      </header>

      <main className="flex-1 pb-20" id="contenido-principal" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-border py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-muted">
            Sube Legal no está afiliado, patrocinado ni avalado por el Centro
            Nacional de Evaluación para la Educación Superior, A.C.
            (CENEVAL). El examen CENEVAL EGEL de Derecho se menciona solo de
            forma descriptiva, como el examen para el que este contenido
            prepara.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
            <Link className="hover:text-brand" href="/terminos">
              Términos de uso
            </Link>
            <Link className="hover:text-brand" href="/privacidad">
              Aviso de privacidad
            </Link>
          </div>
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">
          Este contenido es educativo y está diseñado para preparar el examen
          CENEVAL EGEL de Derecho; no constituye asesoría jurídica. Las
          normas cambian: consulta siempre la fuente oficial y su fecha de
          vigencia antes de aplicarlas a un caso real.
        </p>
      </footer>
    </div>
  );
}
