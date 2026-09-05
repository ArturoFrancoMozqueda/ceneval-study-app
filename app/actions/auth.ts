"use server";

import { redirect } from "next/navigation";
import {
  authCallbackUrl,
  validatePasswordInput,
} from "@/lib/auth/registration";
import {
  invalidCredentialsState,
  type SignInState,
  validateSignInInput,
} from "@/lib/auth-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function value(formData: FormData, field: string) {
  const entry = formData.get(field);
  return typeof entry === "string" ? entry.trim() : "";
}

function authError(path: string, message: string, field?: string): never {
  const params = new URLSearchParams({ error: message });
  if (field) params.set("field", field);
  redirect(`${path}?${params.toString()}`);
}

export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const validationState = validateSignInInput(email, password);

  if (validationState) return validationState;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return invalidCredentialsState();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,terms_accepted_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "student")
  ) {
    await supabase.auth.signOut();
    return invalidCredentialsState();
  }

  if (!profile.terms_accepted_at) redirect("/aceptar-terminos");
  redirect("/");
}

export async function acceptTermsAction(formData: FormData) {
  if (formData.get("termsAccepted") !== "on") {
    authError(
      "/aceptar-terminos",
      "Debes aceptar los términos de uso y el aviso de privacidad para continuar.",
      "termsAccepted",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authData.user) redirect("/iniciar-sesion");

  const { data, error } = await supabase.rpc("accept_terms_v1");

  if (error || typeof data !== "string") {
    authError(
      "/aceptar-terminos",
      "No pudimos guardar tu aceptación. Intenta nuevamente.",
    );
  }

  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!email.includes("@")) {
    authError(
      "/recuperar-contrasena",
      "Escribe un correo válido.",
      "email",
    );
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl(
      "/auth/confirm?next=/actualizar-contrasena",
      process.env.NEXT_PUBLIC_SITE_URL,
    ),
  });

  redirect(
    "/iniciar-sesion?message=Si el correo existe, recibirás un enlace para cambiar tu contraseña.",
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = value(formData, "password");
  const validation = validatePasswordInput(password);
  if (!validation.success) {
    authError(
      "/actualizar-contrasena",
      validation.message,
      "password",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: validation.password,
  });

  if (error) {
    authError(
      "/actualizar-contrasena",
      "El enlace venció o no pudimos cambiar la contraseña.",
    );
  }

  const { data: currentAuth } = await supabase.auth.getUser();
  if (!currentAuth.user) redirect("/iniciar-sesion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", currentAuth.user.id)
    .maybeSingle();
  if (!profile?.terms_accepted_at) {
    redirect("/aceptar-terminos?message=Contraseña actualizada.");
  }
  redirect("/cuenta?saved=Contraseña actualizada.");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/iniciar-sesion");
}
