import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadClassPackage } from "../lib/content/load-package";

const PACKAGE_FIXTURE = join(
  process.cwd(),
  "content",
  "packages",
  "audio-67-obligaciones-fiscales-regimen.json",
);

async function createPackageFixture(
  directory: string,
  transcript: Record<string, unknown>,
) {
  const packageContents = JSON.parse(await readFile(PACKAGE_FIXTURE, "utf8"));
  packageContents.transcript = {
    ...transcript,
    cleaned: packageContents.transcript.cleaned,
  };

  const packagePath = join(directory, "package.json");
  await writeFile(packagePath, JSON.stringify(packageContents), "utf8");
  return packagePath;
}

async function withTranscriptsDirectory(
  directory: string | undefined,
  operation: () => Promise<void>,
) {
  const previousValue = process.env.CENEVAL_TRANSCRIPTS_DIR;
  if (directory === undefined) {
    delete process.env.CENEVAL_TRANSCRIPTS_DIR;
  } else {
    process.env.CENEVAL_TRANSCRIPTS_DIR = directory;
  }

  try {
    await operation();
  } finally {
    if (previousValue === undefined) {
      delete process.env.CENEVAL_TRANSCRIPTS_DIR;
    } else {
      process.env.CENEVAL_TRANSCRIPTS_DIR = previousValue;
    }
  }
}

test("resuelve una ruta heredada por nombre dentro del directorio configurado", async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), "ceneval-source-"));
  const transcriptsDirectory = join(testDirectory, "transcripts");

  try {
    await mkdir(transcriptsDirectory);
    const original = "Transcripción local suficiente para validar la resolución configurable.";
    await writeFile(join(transcriptsDirectory, "AUDIO 67.txt"), original, "utf8");
    const packagePath = await createPackageFixture(testDirectory, {
      originalFile: "Z:\\archivo-heredado\\AUDIO 67.txt",
    });

    await withTranscriptsDirectory(transcriptsDirectory, async () => {
      const loadedPackage = await loadClassPackage(packagePath);
      assert.equal(loadedPackage.transcript.original, original);
    });
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});

test("resuelve varias fuentes por nombre y conserva sus encabezados", async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), "ceneval-sources-"));
  const transcriptsDirectory = join(testDirectory, "transcripts");

  try {
    await mkdir(transcriptsDirectory);
    await writeFile(
      join(transcriptsDirectory, "AUDIO 01.txt"),
      "Contenido suficientemente largo de la primera transcripción para la prueba.",
      "utf8",
    );
    await writeFile(
      join(transcriptsDirectory, "AUDIO 02.txt"),
      "Contenido suficientemente largo de la segunda transcripción para la prueba.",
      "utf8",
    );
    const packagePath = await createPackageFixture(testDirectory, {
      originalFiles: [
        "X:\\fuentes\\AUDIO 01.txt",
        "Y:\\otras-fuentes\\AUDIO 02.txt",
      ],
    });

    await withTranscriptsDirectory(transcriptsDirectory, async () => {
      const loadedPackage = await loadClassPackage(packagePath);
      assert.match(loadedPackage.transcript.original, /TRANSCRIPCIÓN 1: AUDIO 01\.txt/);
      assert.match(loadedPackage.transcript.original, /TRANSCRIPCIÓN 2: AUDIO 02\.txt/);
    });
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});

test("mantiene la ruta declarada cuando no se configura un directorio", async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), "ceneval-fallback-"));

  try {
    const originalPath = join(testDirectory, "fuente-local.txt");
    const original = "Transcripción local suficiente para comprobar la compatibilidad anterior.";
    await writeFile(originalPath, original, "utf8");
    const packagePath = await createPackageFixture(testDirectory, {
      originalFile: originalPath,
    });

    await withTranscriptsDirectory(undefined, async () => {
      const loadedPackage = await loadClassPackage(packagePath);
      assert.equal(loadedPackage.transcript.original, original);
    });
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});

test("rechaza nombres que podrían salir del directorio configurado", async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), "ceneval-traversal-"));

  try {
    const packagePath = await createPackageFixture(testDirectory, {
      originalFile: "..",
    });

    await withTranscriptsDirectory(testDirectory, async () => {
      await assert.rejects(
        loadClassPackage(packagePath),
        /no tiene un nombre de archivo seguro/,
      );
    });
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});

test("explica en español cuando falta una fuente configurada", async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), "ceneval-missing-"));

  try {
    const packagePath = await createPackageFixture(testDirectory, {
      originalFile: "Q:\\fuentes\\AUDIO 70.txt",
    });

    await withTranscriptsDirectory(testDirectory, async () => {
      await assert.rejects(
        loadClassPackage(packagePath),
        /No se pudo leer la transcripción "AUDIO 70\.txt".*Verifica que el archivo exista y sea accesible/,
      );
    });
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});
