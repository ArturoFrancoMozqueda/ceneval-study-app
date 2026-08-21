import { readFile } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve } from "node:path";
import {
  classPackageFileSchema,
  classPackageSchema,
  type ClassPackage,
} from "./package-schema";

const TRANSCRIPTION_BANNERS = [
  "(Transcrito por TurboScribe. Actualizar a Ilimitado para eliminar este mensaje.)",
  "(Transcribed by TurboScribe. Go Unlimited to remove this message.)",
];

function cleanTranscript(original: string) {
  return TRANSCRIPTION_BANNERS.reduce(
    (text, banner) => text.replaceAll(banner, ""),
    original,
  )
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSourceBasename(sourcePath: string) {
  return basename(sourcePath.replaceAll("\\", "/"));
}

function resolveTranscriptSource(sourcePath: string) {
  const configuredDirectory = process.env.CENEVAL_TRANSCRIPTS_DIR?.trim();
  if (!configuredDirectory) {
    return resolve(sourcePath);
  }

  const transcriptsDirectory = resolve(configuredDirectory);
  const sourceBasename = getSourceBasename(sourcePath);

  if (
    !sourceBasename ||
    sourceBasename === "." ||
    sourceBasename === ".."
  ) {
    throw new Error(
      `La fuente de transcripción "${sourcePath}" no tiene un nombre de archivo seguro.`,
    );
  }

  const resolvedSource = resolve(transcriptsDirectory, sourceBasename);
  const sourceRelativePath = relative(transcriptsDirectory, resolvedSource);
  if (
    sourceRelativePath === "" ||
    sourceRelativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    sourceRelativePath === ".." ||
    isAbsolute(sourceRelativePath)
  ) {
    throw new Error(
      `La fuente de transcripción "${sourcePath}" intenta salir del directorio configurado.`,
    );
  }

  return resolvedSource;
}

async function readTranscriptSource(sourcePath: string) {
  const resolvedSource = resolveTranscriptSource(sourcePath);

  try {
    return await readFile(resolvedSource, "utf8");
  } catch (cause) {
    throw new Error(
      `No se pudo leer la transcripción "${getSourceBasename(sourcePath)}" en "${resolvedSource}". Verifica que el archivo exista y sea accesible.`,
      { cause },
    );
  }
}

export async function loadClassPackage(filePath: string): Promise<ClassPackage> {
  const absolutePackagePath = resolve(filePath);
  const raw = await readFile(absolutePackagePath, "utf8");
  const packageFile = classPackageFileSchema.parse(JSON.parse(raw));

  let original = packageFile.transcript.original;
  if (!original && packageFile.transcript.originalFiles) {
    const originals = await Promise.all(
      packageFile.transcript.originalFiles.map((sourcePath) =>
        readTranscriptSource(sourcePath),
      ),
    );
    original = originals
      .map(
        (text, index) =>
          `===== TRANSCRIPCIÓN ${index + 1}: ${getSourceBasename(packageFile.transcript.originalFiles![index])} =====\n${text}`,
      )
      .join("\n\n");
  }
  if (!original) {
    original = await readTranscriptSource(packageFile.transcript.originalFile!);
  }

  return classPackageSchema.parse({
    ...packageFile,
    transcript: {
      original,
      cleaned: packageFile.transcript.cleaned ?? cleanTranscript(original),
    },
  });
}
