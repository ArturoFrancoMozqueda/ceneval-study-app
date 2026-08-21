export const RESTORE_DATABASE_PREFIX = "ceneval_restore_drill_";
export const RESTORE_DATABASE_MARKER = "ceneval-local-restore-drill-v1";

export function validateRestoreDatabaseName(name: string) {
  if (!/^ceneval_restore_drill_[a-f0-9]{12}$/.test(name)) {
    throw new Error("Gate local: nombre de base temporal no permitido.");
  }
  if (name === "postgres" || name === "ceneval-study-app") {
    throw new Error("Gate local: nunca se puede usar la base del workspace.");
  }
  return name;
}

export function createRestoreDatabaseName(nonce = crypto.randomUUID()) {
  const compact = nonce.toLowerCase().replace(/[^a-f0-9]/g, "");
  if (compact.length < 12) {
    throw new Error("Gate local: no se pudo generar un nonce seguro.");
  }
  return validateRestoreDatabaseName(
    `${RESTORE_DATABASE_PREFIX}${compact.slice(0, 12)}`,
  );
}
