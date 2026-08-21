import {
  classPackageSchema,
  importableClassPackageSchema,
  type ImportableClassPackage,
} from "./package-schema";
import { assertPackageCanReachSupabase } from "./import-gate";

export const importClassPackageRpc = "import_class_package_v12";
export const exportClassPackageRpc = "export_class_package_v12";

type RpcError = {
  code?: string;
  message?: string;
};

export type PackageRpcResult = {
  data: unknown;
  error: RpcError | null;
};

export type InvokePackageRpc = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<PackageRpcResult>;

export function parseImportableClassPackage(
  input: unknown,
): ImportableClassPackage {
  const readableBundle = classPackageSchema.parse(input);
  assertPackageCanReachSupabase(readableBundle);
  return importableClassPackageSchema.parse(readableBundle);
}

function parseClassId(value: unknown): number {
  const classId = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(classId) || Number(classId) <= 0) {
    throw new Error(
      "La base no confirmó la clase importada. No vuelvas a ejecutar el comando hasta revisar el registro operativo.",
    );
  }
  return Number(classId);
}

export async function importClassPackage(
  invokeRpc: InvokePackageRpc,
  input: unknown,
): Promise<number> {
  const bundle = parseImportableClassPackage(input);
  const { data, error } = await invokeRpc(importClassPackageRpc, {
    p_package: bundle,
  });

  if (error?.code === "23505") {
    throw new Error(
      `${bundle.curriculum.code} o su orden curricular ya existen. La operación transaccional no importó un duplicado.`,
    );
  }
  if (error) {
    throw new Error(
      "No se pudo importar el paquete. La operación transaccional fue rechazada sin exponer datos editoriales.",
    );
  }

  return parseClassId(data);
}

export async function exportClassPackage(
  invokeRpc: InvokePackageRpc,
  classId: number,
): Promise<ImportableClassPackage> {
  if (!Number.isSafeInteger(classId) || classId <= 0) {
    throw new Error("La clase solicitada para exportación no es válida.");
  }

  const { data, error } = await invokeRpc(exportClassPackageRpc, {
    p_class_id: classId,
  });
  if (error) {
    throw new Error(
      "No se pudo exportar la clase sin exponer datos editoriales internos.",
    );
  }
  return importableClassPackageSchema.parse(data);
}

export function serializeClassPackage(
  bundle: ImportableClassPackage,
): string {
  const validated = importableClassPackageSchema.parse(bundle);
  return `${JSON.stringify(validated, null, 2)}\n`;
}
