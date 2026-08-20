import { loadClassPackage } from "../lib/content/load-package";

const fileArgument = process.argv[2];
if (!fileArgument) {
  throw new Error(
    "Uso: npm run content:check -- content/packages/mi-clase.json",
  );
}

async function main() {
  const bundle = await loadClassPackage(fileArgument!);
  const curriculumSummary =
    bundle.packageVersion === "1.1"
      ? `, ${bundle.curriculum.code} (orden ${bundle.curriculum.order})`
      : ", contrato histórico 1.0 no importable";
  console.log(
    `Paquete válido: ${bundle.class.title}${curriculumSummary}, ${bundle.topics.length} tema(s).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
