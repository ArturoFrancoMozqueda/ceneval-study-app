import { z } from "zod";

export const REGISTRATION_CONFIRMATION_MESSAGE =
  "Revisa tu correo para confirmar tu cuenta. El mensaje puede tardar unos minutos.";

const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Escribe un correo válido.")
    .pipe(z.email("Escribe un correo válido.")),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(128, "La contraseña no puede superar 128 caracteres.")
    .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, "Incluye al menos una letra.")
    .regex(/[0-9]/, "Incluye al menos un número."),
  termsAccepted: z.boolean().refine((accepted) => accepted, {
    message: "Debes aceptar los términos de uso y el aviso de privacidad.",
  }),
});

const passwordSchema = registrationSchema.shape.password;

export type RegistrationField =
  | "fullName"
  | "email"
  | "password"
  | "termsAccepted";

export type RegistrationResult =
  | { success: true; data: z.infer<typeof registrationSchema> }
  | { success: false; field: RegistrationField; message: string };

export function validateRegistrationInput(input: {
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}): RegistrationResult {
  const result = registrationSchema.safeParse(input);

  if (result.success) return { success: true, data: result.data };

  const issue = result.error.issues[0];
  const field = issue.path[0];

  return {
    success: false,
    field:
      field === "fullName" ||
      field === "email" ||
      field === "password" ||
      field === "termsAccepted"
        ? field
        : "email",
    message: issue.message,
  };
}

export function validatePasswordInput(password: string) {
  const result = passwordSchema.safeParse(password);
  return result.success
    ? { success: true as const, password: result.data }
    : { success: false as const, message: result.error.issues[0].message };
}

export function isAuthorizedPrivateRegistration(
  email: string,
  configuredAdminEmail: string | undefined,
) {
  const allowedEmail = configuredAdminEmail?.trim().toLowerCase();
  return Boolean(allowedEmail && email.trim().toLowerCase() === allowedEmail);
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
