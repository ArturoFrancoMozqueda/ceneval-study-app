"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { AuthCard, AuthField } from "@/components/auth-card";
import type { SignInState } from "@/lib/auth-state";

export function SignInForm({
  initialError,
  initialMessage,
  privateAccessOnly,
}: {
  initialError?: string;
  initialMessage?: string;
  privateAccessOnly: boolean;
}) {
  const initialState: SignInState = { message: initialError };
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );
  const [email, setEmail] = useState("");
  const formErrorId = state.message ? "sign-in-error" : undefined;
  const emailInvalid = state.invalidFields?.includes("email") ?? false;
  const passwordInvalid = state.invalidFields?.includes("password") ?? false;

  return (
    <AuthCard
      action={formAction}
      description="Entra a tu biblioteca y continúa tu preparación."
      error={state.message}
      errorId="sign-in-error"
      fields={
        <>
          <AuthField
            autoComplete="email"
            describedBy={
              emailInvalid && !state.fieldErrors?.email
                ? formErrorId
                : undefined
            }
            description="Usa el correo asociado a tu cuenta."
            error={state.fieldErrors?.email}
            invalid={emailInvalid}
            label="Correo electrónico"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <AuthField
            autoComplete="current-password"
            describedBy={
              passwordInvalid && !state.fieldErrors?.password
                ? formErrorId
                : undefined
            }
            description="Puedes usar el autocompletado o pegar tu contraseña."
            error={state.fieldErrors?.password}
            invalid={passwordInvalid}
            label="Contraseña"
            name="password"
            type="password"
          />
          <div className="text-right">
            <Link
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
              href="/recuperar-contrasena"
            >
              Olvidé mi contraseña
            </Link>
          </div>
        </>
      }
      footer={
        privateAccessOnly ? (
          <>El acceso está disponible solo para cuentas autorizadas.</>
        ) : (<>
          ¿Aún no tienes cuenta?{" "}
          <Link
            className="inline-flex min-h-11 items-center font-semibold text-brand"
            href="/registro"
          >
            Regístrate
          </Link>
        </>)
      }
      message={initialMessage}
      pending={pending}
      pendingLabel="Iniciando sesión…"
      submitLabel="Iniciar sesión"
      title="Bienvenida de nuevo"
    />
  );
}
