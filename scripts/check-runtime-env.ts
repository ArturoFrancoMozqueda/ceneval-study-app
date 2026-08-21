import { validateBuildEnvironment, validateRuntimeEnvironment } from "../lib/operations/runtime-env";

const mode = process.argv[2];
const production = process.argv.includes("--production");
const allowedArguments = new Set(["--build", "--runtime", "--production"]);
if (process.argv.slice(2).some((argument) => !allowedArguments.has(argument))) {
  throw new Error("Uso: check-runtime-env.ts --build|--runtime [--production]");
}
if (mode === "--build") {
  validateBuildEnvironment(process.env, { production });
  console.log("Preflight de configuración de build aprobado.");
} else if (mode === "--runtime") {
  validateRuntimeEnvironment(process.env, { production });
  console.log("Preflight de configuración de runtime aprobado.");
} else {
  throw new Error("Uso: check-runtime-env.ts --build|--runtime [--production]");
}
