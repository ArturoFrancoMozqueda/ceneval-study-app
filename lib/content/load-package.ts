import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
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

export async function loadClassPackage(filePath: string): Promise<ClassPackage> {
  const absolutePackagePath = resolve(filePath);
  const raw = await readFile(absolutePackagePath, "utf8");
  const packageFile = classPackageFileSchema.parse(JSON.parse(raw));

  let original = packageFile.transcript.original;
  if (!original && packageFile.transcript.originalFiles) {
    const originals = await Promise.all(
      packageFile.transcript.originalFiles.map((sourcePath) =>
        readFile(resolve(sourcePath), "utf8"),
      ),
    );
    original = originals
      .map(
        (text, index) =>
          `===== TRANSCRIPCIÓN ${index + 1}: ${basename(packageFile.transcript.originalFiles![index])} =====\n${text}`,
      )
      .join("\n\n");
  }
  if (!original) {
    original = await readFile(
      resolve(packageFile.transcript.originalFile!),
      "utf8",
    );
  }

  return classPackageSchema.parse({
    ...packageFile,
    transcript: {
      original,
      cleaned: packageFile.transcript.cleaned ?? cleanTranscript(original),
    },
  });
}
