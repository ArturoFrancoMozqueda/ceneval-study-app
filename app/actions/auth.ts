"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPrivateAccessOnly } from "@/lib/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function value(formData: FormData, field: string) {
  const entry = formData.get(field);
  return typeof entry === "string" ? entry.trim() : "";
}

function authError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (!email || !password) {
    authError("/iniciar-sesion", "Escribe tu correo y contraseña.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    authError(
      "/iniciar-sesion",
      "No pudimos iniciar sesión. Revisa tus datos o confirma tu correo.",
    );
  }

  if (isPrivateAccessOnly()) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      authError(
        "/iniciar-sesion",
        "Esta aplicación es privada y solo permite la cuenta administradora.",
      );
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
    authError("/registro", "Escribe tu nombre.");
  }
  if (!email.includes("@")) {
    authError("/registro", "Escribe un correo válido.");
  }
  if (password.length < 8) {
    authError("/registro", "La contraseña debe tener al menos 8 caracteres.");
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
      error.message.toLowerCase().includes("already")
        ? "Ese correo ya tiene una cuenta."
        : "No pudimos crear la cuenta. Intenta nuevamente.",
    );
  }

  redirect("/iniciar-sesion?message=Revisa tu correo para confirmar la cuenta.");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!email.includes("@")) {
    authError("/recuperar-contrasena", "Escribe un correo válido.");
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
