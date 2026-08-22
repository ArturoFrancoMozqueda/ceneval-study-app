export const PRIVATE_PREPROD_CONFIRMATION = "--confirm-private-preprod";
export const EXPECTED_SUPABASE_URL =
  "https://qcseoivljzuxzqeaxfly.supabase.co";
export const EXPECTED_SITE_URL = "https://ceneval-study-app.vercel.app";
export const EXPECTED_CURRICULUM_CODES = Array.from(
  { length: 57 },
  (_, index) => `C${String(index + 1).padStart(2, "0")}`,
);

type TargetInput = {
  confirmation: boolean;
  execute: boolean;
  privateAccessOnly: string | undefined;
  secretKey: string | undefined;
  siteUrl: string | undefined;
  supabaseUrl: string | undefined;
};

export function assertPrivatePreprodTarget(input: TargetInput): void {
  if (!input.execute) {
    throw new Error("Operación cancelada. Falta --execute.");
  }
  if (!input.confirmation) {
    throw new Error(
      `Operación cancelada. Agrega ${PRIVATE_PREPROD_CONFIRMATION} para confirmar la preproducción privada.`,
    );
  }
  if (input.supabaseUrl?.trim() !== EXPECTED_SUPABASE_URL) {
    throw new Error("El destino Supabase no es el proyecto CENEVAL esperado.");
  }
  if (input.siteUrl?.trim() !== EXPECTED_SITE_URL) {
    throw new Error("El sitio configurado no es el despliegue privado de CENEVAL.");
  }
  if (input.privateAccessOnly?.trim() !== "true") {
    throw new Error("La importación exige PRIVATE_ACCESS_ONLY=true.");
  }
  if (!input.secretKey?.trim().startsWith("sb_secret_")) {
    throw new Error("Falta una clave secreta moderna de Supabase.");
  }
}

export function assertExistingCurriculumPrefix(codes: string[]): void {
  const expectedPrefix = EXPECTED_CURRICULUM_CODES.slice(0, codes.length);
  if (
    codes.length > EXPECTED_CURRICULUM_CODES.length ||
    codes.some((code, index) => code !== expectedPrefix[index])
  ) {
    throw new Error(
      "La reanudación exige un prefijo curricular continuo desde C01.",
    );
  }
}

export function assertCurriculumManifest(codes: string[]): void {
  const sorted = [...codes].sort((left, right) => left.localeCompare(right));
  if (
    sorted.length !== EXPECTED_CURRICULUM_CODES.length ||
    sorted.some((code, index) => code !== EXPECTED_CURRICULUM_CODES[index])
  ) {
    throw new Error(
      "El lote debe contener exactamente C01–C57, sin duplicados ni C58.",
    );
  }
}
