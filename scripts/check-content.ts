import { ZodError } from "zod";
import { loadClassPackage } from "../lib/content/load-package";
import { assessEditorialGate } from "../lib/content/package-schema";

const fileArgument = process.argv[2];
if (!fileArgument) {
  throw new Error(
    "Uso: npm run content:check -- content/packages/mi-clase.json",
  );
}

async function main() {
  const bundle = await loadClassPackage(fileArgument!);
  const gate = assessEditorialGate(bundle);
  if (!gate.publishable) {
    const diagnostics = gate.issues
      .map(({ path, message }) => `- ${path}: ${message}`)
      .join("\n");
    throw new Error(
      `El paquete es legible, pero NO pasa el gate editorial trazable:\n${diagnostics}`,
    );
  }

  const curriculumSummary =
    bundle.packageVersion === "1.1" || bundle.packageVersion === "1.2"
      ? `, ${bundle.curriculum.code} (orden ${bundle.curriculum.order})`
      : ", contrato histórico 1.0 no importable";
  console.log(
    `Paquete válido y trazable: ${bundle.class.title}${curriculumSummary}, ${bundle.topics.length} tema(s).`,
  );
}

main().catch((error) => {
  if (error instanceof ZodError) {
    const diagnostics = error.issues
      .map((issue) => {
        const path = issue.path.reduce<string>((result, segment) => {
          if (typeof segment === "number") return `${result}[${segment}]`;
          const pathSegment = String(segment);
          return result ? `${result}.${pathSegment}` : pathSegment;
        }, "");
        return `- ${path || "paquete"}: ${issue.message}`;
      })
      .join("\n");
    console.error(`El paquete no cumple el contrato editorial:\n${diagnostics}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
