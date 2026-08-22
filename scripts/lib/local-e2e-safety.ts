export const LOCAL_PROJECT_ID = "ceneval-study-app";
export const LOCAL_API_PORT = "54321";
export const LOCAL_DB_PORT = "54322";
export const LOCAL_E2E_PORT = "3100";
export const SYNTHETIC_CURRICULUM_CODE = "C41";
export const SYNTHETIC_CLASS_TITLE = "Clase sintética de persistencia";
export const SYNTHETIC_SUBJECT_NAME = "Materia sintética";

const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export type LocalSupabaseCredentials = {
  apiUrl: string;
  databaseUrl: string;
  publishableKey: string;
  secretKey: string;
};

function requireLoopbackUrl(
  rawUrl: unknown,
  expectedPort: string,
  protocols: ReadonlySet<string>,
  label: string,
) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new Error(`Gate local: falta ${label}.`);
  }
  const url = new URL(rawUrl);
  if (!loopbackHosts.has(url.hostname)) {
    throw new Error(`Gate local: ${label} no apunta a loopback.`);
  }
  if (!protocols.has(url.protocol) || url.port !== expectedPort) {
    throw new Error(`Gate local: ${label} no usa el protocolo o puerto local esperado.`);
  }
  if (url.username || url.password) {
    if (label !== "DB_URL") {
      throw new Error(`Gate local: ${label} no debe incluir credenciales.`);
    }
  }
  return url;
}

function readJwtRole(token: unknown) {
  if (typeof token !== "string" || !token.trim()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function requireKey(
  modernKey: unknown,
  legacyKey: unknown,
  modernPrefix: string,
  legacyRole: "anon" | "service_role",
) {
  if (typeof modernKey === "string" && modernKey.startsWith(modernPrefix)) {
    return modernKey;
  }
  if (readJwtRole(legacyKey) === legacyRole) return String(legacyKey);
  throw new Error(`Gate local: falta una clave local válida para ${legacyRole}.`);
}

export function assertLocalProjectConfig(config: string) {
  const match = config.match(/^project_id\s*=\s*"([^"]+)"/m);
  if (match?.[1] !== LOCAL_PROJECT_ID) {
    throw new Error("Gate local: el project_id de Supabase no es el esperado.");
  }
}

export function validateLocalSupabaseStatus(
  status: Record<string, unknown>,
): LocalSupabaseCredentials {
  const apiUrl = requireLoopbackUrl(
    status.API_URL,
    LOCAL_API_PORT,
    new Set(["http:"]),
    "API_URL",
  );
  const databaseUrl = requireLoopbackUrl(
    status.DB_URL,
    LOCAL_DB_PORT,
    new Set(["postgresql:", "postgres:"]),
    "DB_URL",
  );
  const publishableKey = requireKey(
    status.PUBLISHABLE_KEY,
    status.ANON_KEY,
    "sb_publishable_",
    "anon",
  );
  const secretKey = requireKey(
    status.SECRET_KEY,
    status.SERVICE_ROLE_KEY,
    "sb_secret_",
    "service_role",
  );

  return {
    apiUrl: apiUrl.toString().replace(/\/$/, ""),
    databaseUrl: databaseUrl.toString(),
    publishableKey,
    secretKey,
  };
}

export function validateLocalBaseUrl(rawUrl: string) {
  const url = requireLoopbackUrl(
    rawUrl,
    LOCAL_E2E_PORT,
    new Set(["http:"]),
    "E2E_BASE_URL",
  );
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Gate local: E2E_BASE_URL no admite ruta, query ni fragmento.");
  }
  return url.toString().replace(/\/$/, "");
}

export function selectSyntheticResidueIds(
  rows: ReadonlyArray<{
    id: number;
    title: string;
    subjects: { name: string } | ReadonlyArray<{ name: string }> | null;
  }>,
) {
  return rows.map((row) => {
    const subject = Array.isArray(row.subjects)
      ? row.subjects[0]
      : row.subjects;
    if (
      row.title !== SYNTHETIC_CLASS_TITLE ||
      subject?.name !== SYNTHETIC_SUBJECT_NAME
    ) {
      throw new Error(
        `Gate local: ${SYNTHETIC_CURRICULUM_CODE} pertenece a contenido ajeno y no se modificará.`,
      );
    }
    return row.id;
  });
}
