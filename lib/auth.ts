import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "student";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  termsAcceptedAt: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,role,terms_accepted_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "student")
  ) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile.full_name ?? "",
    role: profile.role,
    termsAcceptedAt: profile.terms_accepted_at,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  if (!user.termsAcceptedAt) redirect("/aceptar-terminos");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
