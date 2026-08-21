import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const TRANSCRIPT_COUNT = 70;
export const MANIFEST_COLUMNS = ["Name", "Length", "SHA256"] as const;

export type TranscriptManifestEntry = {
  Name: string;
  Length: number;
  SHA256: string;
};

export type ArchiveInventory = {
  entries: TranscriptManifestEntry[];
  missing: string[];
  unexpected: string[];
  duplicates: string[];
};

export type ManifestVerification = {
  ok: boolean;
  missingFromArchive: string[];
  missingFromManifest: string[];
  lengthMismatches: string[];
  hashMismatches: string[];
  manifestErrors: string[];
};

export function expectedTranscriptNames(): string[] {
  return Array.from(
    { length: TRANSCRIPT_COUNT },
    (_, index) => `AUDIO ${String(index + 1).padStart(2, "0")}.txt`,
  );
}

async function hashFile(filePath: string): Promise<string> {
  const contents = await fs.readFile(filePath);
  return createHash("sha256").update(contents).digest("hex").toUpperCase();
}

export async function inventoryTranscriptArchive(
  rootDirectory: string,
): Promise<ArchiveInventory> {
  const directoryEntries = await fs.readdir(rootDirectory, {
    withFileTypes: true,
  });
  const expected = new Set(expectedTranscriptNames());
  const candidates = new Map<string, string[]>();
  const unexpected: string[] = [];

  for (const directoryEntry of directoryEntries) {
    if (!directoryEntry.isFile()) continue;

    const match = /^AUDIO (\d{2})\.txt$/i.exec(directoryEntry.name);
    if (!match) continue;

    const canonicalName = `AUDIO ${match[1]}.txt`;
    if (!expected.has(canonicalName)) {
      unexpected.push(directoryEntry.name);
      continue;
    }

    const names = candidates.get(canonicalName) ?? [];
    names.push(directoryEntry.name);
    candidates.set(canonicalName, names);
  }

  const missing = expectedTranscriptNames().filter(
    (name) => !candidates.has(name),
  );
  const duplicates = [...candidates.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([name]) => name)
    .sort();
  const entries: TranscriptManifestEntry[] = [];

  for (const expectedName of expectedTranscriptNames()) {
    const actualNames = candidates.get(expectedName);
    if (!actualNames || actualNames.length !== 1) continue;

    const filePath = path.join(rootDirectory, actualNames[0]);
    const stats = await fs.stat(filePath);
    entries.push({
      Name: expectedName,
      Length: stats.size,
      SHA256: await hashFile(filePath),
    });
  }

  return {
    entries,
    missing,
    unexpected: unexpected.sort(),
    duplicates,
  };
}

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"') {
      if (quoted && row[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("El manifiesto contiene una comilla sin cerrar.");
  fields.push(field);
  return fields;
}

export function parseManifestCsv(csv: string): TranscriptManifestEntry[] {
  const rows = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((row) => row.trim().length > 0);

  if (rows.length === 0) throw new Error("El manifiesto está vacío.");
  const header = parseCsvRow(rows[0]);
  if (
    header.length !== MANIFEST_COLUMNS.length ||
    !MANIFEST_COLUMNS.every((column, index) => header[index] === column)
  ) {
    throw new Error(
      `Encabezado inválido. Se esperaba: ${MANIFEST_COLUMNS.join(",")}`,
    );
  }

  return rows.slice(1).map((row, index) => {
    const fields = parseCsvRow(row);
    if (fields.length !== 3) {
      throw new Error(`Fila ${index + 2}: se esperaban tres columnas.`);
    }

    const length = Number(fields[1]);
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new Error(`Fila ${index + 2}: Length no es un entero válido.`);
    }
    if (!/^[A-Fa-f0-9]{64}$/.test(fields[2])) {
      throw new Error(`Fila ${index + 2}: SHA256 no es válido.`);
    }

    return {
      Name: fields[0],
      Length: length,
      SHA256: fields[2].toUpperCase(),
    };
  });
}

export function serializeManifestCsv(
  entries: TranscriptManifestEntry[],
): string {
  const rows = entries.map(
    (entry) => `${entry.Name},${entry.Length},${entry.SHA256.toUpperCase()}`,
  );
  return `${MANIFEST_COLUMNS.join(",")}\n${rows.join("\n")}\n`;
}

export function verifyManifest(
  inventory: ArchiveInventory,
  manifestEntries: TranscriptManifestEntry[],
): ManifestVerification {
  const expected = new Set(expectedTranscriptNames());
  const manifestByName = new Map<string, TranscriptManifestEntry>();
  const manifestErrors: string[] = [];

  for (const entry of manifestEntries) {
    if (!expected.has(entry.Name)) {
      manifestErrors.push(`Nombre no esperado: ${entry.Name}`);
    }
    if (manifestByName.has(entry.Name)) {
      manifestErrors.push(`Entrada duplicada: ${entry.Name}`);
    }
    manifestByName.set(entry.Name, entry);
  }

  const archiveByName = new Map(
    inventory.entries.map((entry) => [entry.Name, entry]),
  );
  const missingFromArchive = expectedTranscriptNames().filter(
    (name) => !archiveByName.has(name),
  );
  const missingFromManifest = expectedTranscriptNames().filter(
    (name) => !manifestByName.has(name),
  );
  const lengthMismatches: string[] = [];
  const hashMismatches: string[] = [];

  for (const name of expectedTranscriptNames()) {
    const archiveEntry = archiveByName.get(name);
    const manifestEntry = manifestByName.get(name);
    if (!archiveEntry || !manifestEntry) continue;
    if (archiveEntry.Length !== manifestEntry.Length) {
      lengthMismatches.push(name);
    }
    if (archiveEntry.SHA256 !== manifestEntry.SHA256.toUpperCase()) {
      hashMismatches.push(name);
    }
  }

  const ok =
    missingFromArchive.length === 0 &&
    missingFromManifest.length === 0 &&
    inventory.unexpected.length === 0 &&
    inventory.duplicates.length === 0 &&
    lengthMismatches.length === 0 &&
    hashMismatches.length === 0 &&
    manifestErrors.length === 0;

  return {
    ok,
    missingFromArchive,
    missingFromManifest,
    lengthMismatches,
    hashMismatches,
    manifestErrors,
  };
}

type CliOptions = {
  rootDirectory: string;
  manifestPath?: string;
  outputPath?: string;
};

function parseCliOptions(args: string[]): CliOptions {
  let rootDirectory: string | undefined;
  let manifestPath: string | undefined;
  let outputPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--root" || argument === "--manifest" || argument === "--output") {
      const value = args[index + 1];
      if (!value) throw new Error(`Falta un valor después de ${argument}.`);
      if (argument === "--root") rootDirectory = value;
      if (argument === "--manifest") manifestPath = value;
      if (argument === "--output") outputPath = value;
      index += 1;
    } else if (!argument.startsWith("-") && !rootDirectory) {
      rootDirectory = argument;
    } else {
      throw new Error(`Argumento no reconocido: ${argument}`);
    }
  }

  rootDirectory ??= process.env.CENEVAL_TRANSCRIPTS_DIR;
  if (!rootDirectory) {
    throw new Error(
      "Indica la carpeta como primer argumento, con --root o mediante CENEVAL_TRANSCRIPTS_DIR.",
    );
  }

  return { rootDirectory, manifestPath, outputPath };
}

function formatProblems(inventory: ArchiveInventory): string[] {
  const problems: string[] = [];
  if (inventory.missing.length > 0) {
    problems.push(`Faltantes: ${inventory.missing.join(", ")}`);
  }
  if (inventory.unexpected.length > 0) {
    problems.push(`Fuera del rango 01..70: ${inventory.unexpected.join(", ")}`);
  }
  if (inventory.duplicates.length > 0) {
    problems.push(`Duplicados: ${inventory.duplicates.join(", ")}`);
  }
  return problems;
}

export async function runCli(args: string[]): Promise<number> {
  const options = parseCliOptions(args);
  const rootDirectory = path.resolve(options.rootDirectory);
  const inventory = await inventoryTranscriptArchive(rootDirectory);
  const csv = serializeManifestCsv(inventory.entries);

  if (options.outputPath) {
    await fs.writeFile(path.resolve(options.outputPath), csv, {
      encoding: "utf8",
      flag: "wx",
    });
  }

  const archiveProblems = formatProblems(inventory);
  if (options.manifestPath) {
    const manifestCsv = await fs.readFile(path.resolve(options.manifestPath), "utf8");
    const verification = verifyManifest(
      inventory,
      parseManifestCsv(manifestCsv),
    );
    if (verification.ok) {
      console.log(
        `Archivo íntegro: ${inventory.entries.length} transcripciones coinciden en tamaño y SHA-256.`,
      );
      return 0;
    }

    for (const problem of archiveProblems) console.error(problem);
    if (verification.missingFromManifest.length > 0) {
      console.error(
        `Sin entrada en manifiesto: ${verification.missingFromManifest.join(", ")}`,
      );
    }
    if (verification.lengthMismatches.length > 0) {
      console.error(
        `Tamaño distinto: ${verification.lengthMismatches.join(", ")}`,
      );
    }
    if (verification.hashMismatches.length > 0) {
      console.error(`SHA-256 distinto: ${verification.hashMismatches.join(", ")}`);
    }
    for (const error of verification.manifestErrors) console.error(error);
    return 1;
  }

  if (!options.outputPath) process.stdout.write(csv);
  for (const problem of archiveProblems) console.error(problem);
  return archiveProblems.length === 0 ? 0 : 1;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;

if (invokedPath === import.meta.url) {
  runCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
