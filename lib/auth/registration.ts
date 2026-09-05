import { z } from "zod";

const passwordSchema = z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(128, "La contraseña no puede superar 128 caracteres.")
    .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, "Incluye al menos una letra.")
    .regex(/[0-9]/, "Incluye al menos un número.");

export function validatePasswordInput(password: string) {
  const result = passwordSchema.safeParse(password);
  return result.success
    ? { success: true as const, password: result.data }
    : { success: false as const, message: result.error.issues[0].message };
}

export function authCallbackUrl(
  path: "/auth/confirm" | "/auth/confirm?next=/actualizar-contrasena",
  configuredSiteUrl: string | undefined,
) {
  const rawBaseUrl = configuredSiteUrl?.trim() || "http://localhost:3000";
  const baseUrl = new URL(rawBaseUrl);

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL debe usar HTTP o HTTPS.");
  }

  return new URL(path, `${baseUrl.origin}/`).toString();
}
