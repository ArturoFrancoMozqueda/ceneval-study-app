type SupportedPackageVersion = "1.0" | "1.1" | "1.2";

export function assertPackageCanReachSupabase(bundle: {
  packageVersion: SupportedPackageVersion;
}): asserts bundle is { packageVersion: "1.2" } {
  if (bundle.packageVersion === "1.0") {
    throw new Error(
      "El contrato 1.0 es histórico y no importable. Debe migrarse al contrato trazable 1.2 cuando evidenceRegistry pueda persistirse sin pérdida.",
    );
  }

  if (bundle.packageVersion === "1.2") {
    return;
  }

  throw new Error(
    "El contrato 1.1 es legible, pero no es trazable ni importable. Migra el contenido a 1.2 antes de usar Supabase.",
  );
}
