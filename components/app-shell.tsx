"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions/auth";
import {
  BookIcon,
  HomeIcon,
  SearchIcon,
  StudyIcon,
} from "@/components/icons";
import type { CurrentUser } from "@/lib/auth";

const navigation = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/sesiones", label: "Sesiones", icon: StudyIcon },
  { href: "/materias", label: "Biblioteca", icon: BookIcon },
  { href: "/buscar", label: "Buscar", icon: SearchIcon },
];

const authPaths = [
  "/actualizar-contrasena",
  "/iniciar-sesion",
  "/recuperar-contrasena",
  "/registro",
];

// Rutas públicas de marketing (Fase 5 del plan de venta): tienen su propia
// cabecera y pie de página en `components/marketing-shell.tsx`, así que no
// deben quedar envueltas en la barra lateral de la app autenticada.
const marketingPaths = [
  "/precios",
  "/muestra",
  "/preguntas-frecuentes",
  "/terminos",
  "/privacidad",
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/materias" && pathname.startsWith("/clases/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link
      aria-label="Sube Legal, ir al inicio"
      className="group flex items-center gap-3 rounded-xl"
      href="/"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold tracking-tight text-white shadow-sm transition-transform group-hover:-rotate-2">
        SL
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-tight text-foreground">
          Sube Legal
        </span>
        <span className="block text-xs text-muted">Biblioteca CENEVAL Derecho</span>
      </span>
    </Link>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: CurrentUser | null;
}) {
  const pathname = usePathname();
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  // La raíz sin sesión es la landing pública (ver app/page.tsx); con
  // sesión sigue siendo el panel autenticado de siempre.
  const isMarketingPage =
    (pathname === "/" && !user) ||
    marketingPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

  if (isAuthPage) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-background px-5 py-10"
        id="contenido-principal"
        tabIndex={-1}
      >
        {children}
      </main>
    );
  }

  if (isMarketingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-foreground px-4 py-3 font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
        href="#contenido-principal"
      >
        Saltar al contenido principal
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border/80 bg-surface/90 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav aria-label="Navegación principal" className="mt-10 space-y-1.5">
          {navigation.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
                href={href}
                key={href}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        {user?.role === "admin" ? (
          <Link
            className="mt-5 flex min-h-11 items-center rounded-xl border border-brand/15 px-3 text-sm font-semibold text-brand hover:bg-background"
            href="/administrar"
          >
            Panel editorial
          </Link>
        ) : null}
        <div className="mt-auto rounded-2xl border border-success/15 bg-success-soft/65 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-success">
            Tu espacio de estudio
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-foreground/75">
            {user?.fullName || user?.email || "Aprende paso a paso."}
          </p>
          {user ? (
            <div className="mt-3 grid gap-1">
              <Link
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-brand hover:bg-background"
                href="/cuenta"
              >
                Mi cuenta y privacidad
              </Link>
              <form action={signOutAction}>
                <button
                  className="inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-brand hover:bg-background"
                  type="submit"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur lg:hidden">
          <Brand />
          {user ? (
            <details className="group relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-brand marker:content-none">
                Cuenta
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-surface p-4 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">
                  Tu espacio de estudio
                </p>
                <p className="mt-2 break-words text-sm leading-6">
                  {user.fullName || user.email}
                </p>
                <div className="mt-4 grid gap-2 border-t border-border pt-3">
                  {user.role === "admin" ? (
                    <Link
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand hover:bg-background"
                      href="/administrar"
                    >
                      Panel editorial
                    </Link>
                  ) : null}
                  <Link
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand hover:bg-background"
                    href="/actualizar-contrasena"
                  >
                    Cambiar contraseña
                  </Link>
                  <Link
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand hover:bg-background"
                    href="/cuenta"
                  >
                    Mi cuenta y privacidad
                  </Link>
                  <form action={signOutAction}>
                    <button
                      className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-danger hover:bg-background"
                      type="submit"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ) : null}
        </header>
        <main
          className="mx-auto w-full max-w-[1200px] px-5 pb-28 pt-7 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12 lg:pt-12"
          id="contenido-principal"
          tabIndex={-1}
        >
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1200px] px-5 pb-28 sm:px-8 lg:px-10 lg:pb-10">
          <p className="border-t border-border pt-5 text-xs leading-5 text-muted">
            Este contenido es educativo y está diseñado para preparar el examen
            CENEVAL de Derecho; no constituye asesoría jurídica. Las normas
            pueden cambiar, por lo que debes consultar la fuente oficial y su
            fecha de vigencia antes de aplicarlas a un caso real.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Sube Legal no está afiliada, patrocinada ni avalada por el Centro
            Nacional de Evaluación para la Educación Superior, A.C. (CENEVAL).
            &ldquo;Examen CENEVAL EGEL de Derecho&rdquo; se usa solo de forma
            descriptiva, para indicar para qué examen prepara el contenido.
          </p>
        </footer>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgb(23_32_51_/_0.07)] backdrop-blur lg:hidden"
      >
        {navigation.map(({ href, icon: Icon, label }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors ${
                active ? "text-brand" : "text-muted"
              }`}
              href={href}
              key={href}
            >
              <Icon className={`size-5 ${active ? "stroke-[2.2]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
