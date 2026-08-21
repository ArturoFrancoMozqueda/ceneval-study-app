import { createClient } from "@supabase/supabase-js";
import { loadClassPackage } from "../lib/content/load-package";
import {
  importClassPackage,
  parseImportableClassPackage,
} from "../lib/content/package-persistence";

const fileArgument = process.argv[2];
if (!fileArgument) {
  throw new Error(
    "Uso: npm run content:import -- content/packages/mi-clase.json",
  );
}

async function main() {
  const loadedBundle = await loadClassPackage(fileArgument!);
  const bundle = parseImportableClassPackage(loadedBundle);

  // El parser y el gate se ejecutan dentro de importClassPackage antes de la
  // única operación remota. Un contrato 1.0/1.1 nunca alcanza Supabase.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) {
    throw new Error("Faltan las variables privadas de Supabase.");
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const classId = await importClassPackage(
    (functionName, args) => supabase.rpc(functionName, args),
    bundle,
  );

  console.log(
    `Paquete 1.2 importado como borrador. Clase ${classId}. Revisa /administrar/clases/${classId}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falló la importación.");
  process.exitCode = 1;
});
