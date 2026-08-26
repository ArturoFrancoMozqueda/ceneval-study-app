"use server";

import { redirect } from "next/navigation";
import { isPrivateAccessOnly } from "@/lib/access";
import {
  authCallbackUrl,
  validatePasswordInput,
  validateRegistrationInput,
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

  if (isPrivateAccessOnly()) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      return invalidCredentialsState();
    }
  }

  redirect("/");
}

export async function signUpAction(formData: FormData) {
  if (isPrivateAccessOnly()) {
    authError(
      "/registro",
      "El registro público aún no está disponible.",
    );
  }

  const fullName = value(formData, "fullName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const termsAccepted = formData.get("termsAccepted") === "on";
  const validation = validateRegistrationInput({
    fullName,
    email,
    password,
    termsAccepted,
  });

  if (!validation.success) {
    authError("/registro", validation.message, validation.field);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        full_name: validation.data.fullName,
        terms_accepted_at: new Date().toISOString(),
      },
      emailRedirectTo: authCallbackUrl(
        "/auth/confirm",
        process.env.NEXT_PUBLIC_SITE_URL,
      ),
    },
  });

  if (error) {
    authError(
      "/registro",
      "No pudimos crear la cuenta. Revisa los datos o intenta nuevamente.",
    );
  }

  redirect(
    `/iniciar-sesion?message=${encodeURIComponent(
      "Revisa tu correo para confirmar la cuenta.",
    )}`,
  );
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

  redirect("/?message=Contraseña actualizada.");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/iniciar-sesion");
}
