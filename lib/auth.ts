import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isPrivateAccessOnly } from "@/lib/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "student";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role: AppRole = profile?.role === "admin" ? "admin" : "student";

  if (isPrivateAccessOnly() && role !== "admin") {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile?.full_name ?? "",
    role,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
