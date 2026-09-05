import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  closeSync,
  openSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadClassPackage } from "../lib/content/load-package";
import {
  exportClassPackage,
  importClassPackage,
  parseImportableClassPackage,
  toPersistableClassPackage,
  type InvokePackageRpc,
} from "../lib/content/package-persistence";
import { assertClassPackageRoundTrip } from "../lib/content/package-roundtrip";
import {
  assertCurriculumManifest,
  assertExistingCurriculumPrefix,
  assertPrivatePreprodTarget,
  EXPECTED_CURRICULUM_CODES,
  PRIVATE_PREPROD_CONFIRMATION,
} from "./lib/private-preprod-import-safety";

type LoadedPackage = {
  bundle: ReturnType<typeof parseImportableClassPackage>;
  filePath: string;
};

type ExistingClass = {
  curriculum_code: string | null;
  curriculum_order: number | null;
  id: number;
  publication_status: string;
};

const checkpointPath = join(
  process.env.LOCALAPPDATA || tmpdir(),
  "ceneval-study-app",
  "private-preprod-import-checkpoint.json",
);
const lockPath = `${checkpointPath}.lock`;

function assertArguments(): void {
  const allowed = new Set([
    "--execute",
    PRIVATE_PREPROD_CONFIRMATION,
  ]);
  const seen = new Set<string>();
  for (const argument of process.argv.slice(2)) {
    const key = argument.startsWith("--source-commit=")
      ? "--source-commit"
      : argument;
    if ((key !== "--source-commit" && !allowed.has(key)) || seen.has(key)) {
      throw new Error("La importación recibió argumentos inválidos o duplicados.");
    }
    seen.add(key);
  }
}

function saveCheckpoint(
  completed: Array<{ code: string; digest: string }>,
  sourceCommit: string,
): void {
  mkdirSync(dirname(checkpointPath), { recursive: true });
  const temporaryPath = `${checkpointPath}.partial`;
  writeFileSync(
    temporaryPath,
    `${JSON.stringify(
      {
        completed,
        sourceCommit,
        target: "qcseoivljzuxzqeaxfly",
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  renameSync(temporaryPath, checkpointPath);
}

function packageDigest(loaded: LoadedPackage): string {
  return createHash("sha256")
    .update(JSON.stringify(toPersistableClassPackage(loaded.bundle)))
    .digest("hex");
}

function readSourceCommit(): string {
  const requested = process.argv
    .find((argument) => argument.startsWith("--source-commit="))
    ?.slice("--source-commit=".length);
  const actual = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const status = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  }).trim();
  if (!requested || requested !== actual || status) {
    throw new Error(
      "La importación exige un commit exacto y un árbol de trabajo limpio.",
    );
  }
  return actual;
}

async function loadManifest(): Promise<LoadedPackage[]> {
  const packageDirectory = resolve("content/packages");
  const filePaths = readdirSync(packageDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(packageDirectory, name));
  const loaded: LoadedPackage[] = [];

  for (const filePath of filePaths) {
    const bundle = parseImportableClassPackage(
      await loadClassPackage(filePath),
    );
    loaded.push({ bundle, filePath });
  }

  assertCurriculumManifest(loaded.map(({ bundle }) => bundle.curriculum.code));
  return loaded.sort(
    (left, right) => left.bundle.curriculum.order - right.bundle.curriculum.order,
  );
}

async function verifyPersistedPackage(
  invokeRpc: InvokePackageRpc,
  supabase: SupabaseClient,
  loaded: LoadedPackage,
  classId: number,
): Promise<void> {
  const exported = await exportClassPackage(invokeRpc, classId);
  const classResult = (await supabase
    .from("classes")
    .select("publication_status")
    .eq("id", classId)
    .single()) as unknown as {
      data: { publication_status: string } | null;
      error: unknown;
    };
  if (classResult.error || !classResult.data) {
    throw new Error(
      `${loaded.bundle.curriculum.code}: no se pudo verificar la clase persistida.`,
    );
  }
  const topicsResult = (await supabase
    .from("topics")
    .select("approval_status")
    .eq("class_id", classId)
    .order("position", { ascending: true })) as unknown as {
      data: Array<{ approval_status: string }> | null;
      error: unknown;
    };
  if (topicsResult.error || !topicsResult.data) {
    throw new Error(
      `${loaded.bundle.curriculum.code}: no se pudieron verificar sus temas.`,
    );
  }

  try {
    assertClassPackageRoundTrip(loaded.bundle, exported, {
      publicationStatus: classResult.data.publication_status,
      topicApprovalStatuses: topicsResult.data.map((topic) => topic.approval_status),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "verificación fallida";
    throw new Error(`${loaded.bundle.curriculum.code}: ${detail}`);
  }
}

async function main(): Promise<void> {
  assertArguments();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  assertPrivatePreprodTarget({
    confirmation: process.argv.includes(PRIVATE_PREPROD_CONFIRMATION),
    execute: process.argv.includes("--execute"),
    secretKey,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    supabaseUrl: url,
  });
  const sourceCommit = readSourceCommit();

  const packages = await loadManifest();
  const packageByCode = new Map(
    packages.map((loaded) => [loaded.bundle.curriculum.code, loaded]),
  );
  const supabase = createClient(url!, secretKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const invokeRpc: InvokePackageRpc = (functionName, args) =>
    supabase.rpc(functionName, args);

  const existingResult = await supabase
    .from("classes")
    .select("id,curriculum_code,curriculum_order,publication_status")
    .order("curriculum_order", { ascending: true });
  if (existingResult.error) {
    throw new Error("No se pudo comprobar el estado previo del catálogo.");
  }
  const existing = (existingResult.data ?? []) as ExistingClass[];
  const unexpected = existing.find(
    (row) => !row.curriculum_code || !packageByCode.has(row.curriculum_code),
  );
  if (unexpected) {
    throw new Error("La base contiene una clase fuera del manifiesto C01–C57.");
  }
  const existingCodes = existing.map((row, index) => {
    if (row.curriculum_order !== index + 1) {
      throw new Error("La base contiene un orden curricular discontinuo.");
    }
    return row.curriculum_code!;
  });
  assertExistingCurriculumPrefix(existingCodes);

  const completed = new Set<string>();
  const checkpointEntries: Array<{ code: string; digest: string }> = [];
  for (const row of existing) {
    const loaded = packageByCode.get(row.curriculum_code!);
    if (!loaded || row.publication_status !== "draft") {
      throw new Error("La reanudación encontró una clase fuera de borrador.");
    }
    await verifyPersistedPackage(invokeRpc, supabase, loaded, row.id);
    completed.add(row.curriculum_code!);
    checkpointEntries.push({
      code: row.curriculum_code!,
      digest: packageDigest(loaded),
    });
  }
  saveCheckpoint(checkpointEntries, sourceCommit);

  for (const code of EXPECTED_CURRICULUM_CODES) {
    if (completed.has(code)) continue;
    const loaded = packageByCode.get(code)!;
    const classId = await importClassPackage(invokeRpc, loaded.bundle);
    await verifyPersistedPackage(invokeRpc, supabase, loaded, classId);
    completed.add(code);
    checkpointEntries.push({ code, digest: packageDigest(loaded) });
    saveCheckpoint(checkpointEntries, sourceCommit);
    console.log(`[OK] ${code} importado y verificado.`);
  }

  console.log(
    `[OK] Lote privado completo: ${completed.size}/57 borradores.`,
  );
}

mkdirSync(dirname(lockPath), { recursive: true });
let lockDescriptor: number | undefined;
try {
  lockDescriptor = openSync(lockPath, "wx");
} catch {
  console.error("Ya existe una importación privada en ejecución.");
  process.exit(1);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Falló el lote privado sin continuar al siguiente paquete.",
  );
  process.exitCode = 1;
}).finally(() => {
  if (lockDescriptor !== undefined) closeSync(lockDescriptor);
  unlinkSync(lockPath);
});
