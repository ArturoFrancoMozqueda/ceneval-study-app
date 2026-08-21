import { z } from "zod";

const emailSchema = z.string().trim().email().max(254).transform((email) =>
  email.toLowerCase(),
);

export type BootstrapAdminGateway = {
  findUserByEmail(
    email: string,
  ): Promise<{ id: string; emailConfirmed: boolean } | null>;
  inviteUser(email: string, redirectTo: string): Promise<{ id: string }>;
  promoteProfile(userId: string): Promise<{ id: string; role: string }>;
};

export type BootstrapAdminResult = {
  email: string;
  invited: boolean;
  userId: string;
};

export function parseBootstrapAdminArgs(args: string[]) {
  const emailArg = args.find((arg) => arg.startsWith("--email="));
  const confirmed = args.includes("--confirm-production");

  if (!emailArg) {
    throw new Error("Falta --email=correo@dominio.com.");
  }
  if (!confirmed) {
    throw new Error("Falta --confirm-production; no se realizó ningún cambio.");
  }

  return { email: emailSchema.parse(emailArg.slice("--email=".length)) };
}

export function buildInviteRedirect(siteUrl: string) {
  const origin = new URL(siteUrl);
  if (!["http:", "https:"].includes(origin.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL debe usar http o https.");
  }
  origin.pathname = "/auth/confirm";
  origin.search = "";
  origin.searchParams.set("next", "/actualizar-contrasena");
  origin.hash = "";
  return origin.toString();
}

export function requireAllowedAdminEmail(
  requestedEmail: string,
  configuredEmail: string | undefined,
) {
  if (!configuredEmail?.trim()) throw new Error("Falta ADMIN_EMAIL.");
  const requested = emailSchema.parse(requestedEmail);
  const configured = emailSchema.parse(configuredEmail);
  if (requested !== configured) {
    throw new Error("--email debe coincidir exactamente con ADMIN_EMAIL.");
  }
  return requested;
}

export async function bootstrapAdmin(
  gateway: BootstrapAdminGateway,
  email: string,
  redirectTo: string,
): Promise<BootstrapAdminResult> {
  const normalizedEmail = emailSchema.parse(email);
  const existingUser = await gateway.findUserByEmail(normalizedEmail);
  const shouldInvite = existingUser?.emailConfirmed !== true;
  const user = existingUser?.emailConfirmed
    ? existingUser
    : await gateway.inviteUser(normalizedEmail, redirectTo);
  const profile = await gateway.promoteProfile(user.id);

  if (profile.id !== user.id || profile.role !== "admin") {
    throw new Error("No fue posible verificar el rol administrativo.");
  }

  return {
    email: normalizedEmail,
    invited: shouldInvite,
    userId: user.id,
  };
}
