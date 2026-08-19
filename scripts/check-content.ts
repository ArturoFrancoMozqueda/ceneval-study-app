import { loadClassPackage } from "../lib/content/load-package";

const fileArgument = process.argv[2];
if (!fileArgument) {
  throw new Error(
    "Uso: npm run content:check -- content/packages/mi-clase.json",
  );
}

async function main() {
  const bundle = await loadClassPackage(fileArgument!);
  console.log(
    `Paquete válido: ${bundle.class.title}, ${bundle.topics.length} tema(s).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
