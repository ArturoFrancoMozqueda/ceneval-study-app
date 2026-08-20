"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPrivateAccessOnly } from "@/lib/access";
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
      return {
        message:
          "Esta aplicación es privada y solo permite la cuenta administradora.",
      };
    }
  }

  redirect("/");
}

export async function signUpAction(formData: FormData) {
  if (isPrivateAccessOnly()) {
    authError(
      "/iniciar-sesion",
      "El registro está desactivado porque esta aplicación es privada.",
    );
  }

  const fullName = value(formData, "fullName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (fullName.length < 2) {
    authError("/registro", "Escribe tu nombre.", "fullName");
  }
  if (!email.includes("@")) {
    authError("/registro", "Escribe un correo válido.", "email");
  }
  if (password.length < 8) {
    authError(
      "/registro",
      "La contraseña debe tener al menos 8 caracteres.",
      "password",
    );
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    authError(
      "/registro",
      "No pudimos crear la cuenta. Revisa los datos o intenta nuevamente.",
    );
  }

  redirect("/iniciar-sesion?message=Revisa tu correo para confirmar la cuenta.");
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

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/actualizar-contrasena`,
  });

  if (error) {
    authError(
      "/recuperar-contrasena",
      "No pudimos enviar el correo. Intenta nuevamente.",
    );
  }

  redirect(
    "/iniciar-sesion?message=Si el correo existe, recibirás un enlace para cambiar tu contraseña.",
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = value(formData, "password");
  if (password.length < 8) {
    authError(
      "/actualizar-contrasena",
      "La contraseña debe tener al menos 8 caracteres.",
      "password",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

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
