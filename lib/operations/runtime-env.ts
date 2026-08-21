export type RuntimeEnvironment = {
  adminEmail: string;
  publishableKey: string;
  readinessToken: string;
  secretKey: string;
  siteUrl: string;
  supabaseUrl: string;
};

export type BuildEnvironment = Pick<
  RuntimeEnvironment,
  "publishableKey" | "siteUrl" | "supabaseUrl"
>;

type EnvironmentSource = Record<string, string | undefined>;
type ValidationOptions = { production?: boolean };

function required(source: EnvironmentSource, name: string) {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Configuración inválida: falta ${name}.`);
  return value;
}

function parseHttpUrl(value: string, name: string, production: boolean) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Configuración inválida: ${name} no es una URL.`);
  }
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new Error(`Configuración inválida: ${name} debe usar HTTP o HTTPS.`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`Configuración inválida: ${name} contiene componentes prohibidos.`);
  }
  if (url.pathname !== "/" || url.hostname.toLowerCase().includes("tu-proyecto")) {
    throw new Error(`Configuración inválida: ${name} contiene una ruta o placeholder.`);
  }
  if (production && url.protocol !== "https:") {
    throw new Error(`Configuración inválida: ${name} debe usar HTTPS en producción.`);
  }
  return url.origin;
}

function assertOpaqueCredential(value: string, name: string, minimumLength: number) {
  if (value.length < minimumLength || /\s/.test(value) || /^(change|replace|tu[-_])/i.test(value)) {
    throw new Error(`Configuración inválida: ${name} no tiene un formato seguro.`);
  }
}

function jwtRole(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3 || value.length > 8_192) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function assertSupabaseKey(value: string, name: string, role: "anon" | "service_role") {
  const modernPrefix = role === "anon" ? "sb_publishable_" : "sb_secret_";
  const modern = value.startsWith(modernPrefix) && /^[A-Za-z0-9_-]+$/.test(value);
  if (!modern && jwtRole(value) !== role) {
    throw new Error(`Configuración inválida: ${name} no corresponde al rol esperado.`);
  }
}

export function validateBuildEnvironment(
  source: EnvironmentSource,
  options: ValidationOptions = {},
): BuildEnvironment {
  const production = options.production ?? source.VERCEL_ENV === "production";
  const supabaseUrl = parseHttpUrl(
    required(source, "NEXT_PUBLIC_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
    production,
  );
  const siteUrl = parseHttpUrl(
    required(source, "NEXT_PUBLIC_SITE_URL"),
    "NEXT_PUBLIC_SITE_URL",
    production,
  );
  const publishableKey = required(source, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  assertOpaqueCredential(publishableKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", 20);
  assertSupabaseKey(publishableKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon");
  if (source.PRIVATE_ACCESS_ONLY?.trim() !== "true") {
    throw new Error("Configuración inválida: PRIVATE_ACCESS_ONLY debe ser true.");
  }
  return { publishableKey, siteUrl, supabaseUrl };
}

export function validateRuntimeEnvironment(
  source: EnvironmentSource,
  options: ValidationOptions = {},
): RuntimeEnvironment {
  const build = validateBuildEnvironment(source, options);
  const secretKey = required(source, "SUPABASE_SECRET_KEY");
  const readinessToken = required(source, "OPS_READINESS_TOKEN");
  const adminEmail = required(source, "ADMIN_EMAIL").toLowerCase();
  assertOpaqueCredential(secretKey, "SUPABASE_SECRET_KEY", 24);
  assertSupabaseKey(secretKey, "SUPABASE_SECRET_KEY", "service_role");
  assertOpaqueCredential(readinessToken, "OPS_READINESS_TOKEN", 32);
  if (secretKey === build.publishableKey) {
    throw new Error("Configuración inválida: las claves de Supabase no pueden coincidir.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error("Configuración inválida: ADMIN_EMAIL no es un correo válido.");
  }
  return { ...build, adminEmail, readinessToken, secretKey };
}
import { Buffer } from "node:buffer";
