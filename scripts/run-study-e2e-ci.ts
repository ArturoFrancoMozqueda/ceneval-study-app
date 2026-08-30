import { spawn, type ChildProcess } from "node:child_process";
import { connect } from "node:net";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const nextCli = resolve(workspaceRoot, "node_modules/next/dist/bin/next");
const e2eScript = resolve(workspaceRoot, "scripts/test-study-e2e.py");
const baseUrl = "http://127.0.0.1:3100";
const e2ePort = 3100;
const python = process.env.E2E_PYTHON?.trim() || "python3";

if (process.platform === "win32") {
  throw new Error(
    "Este lanzador es exclusivo de CI Linux; en Windows usa npm run test:e2e:local.",
  );
}
if (process.env.E2E_BASE_URL !== baseUrl) {
  throw new Error(`E2E_BASE_URL debe ser exactamente ${baseUrl}.`);
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`El proceso terminó por la señal ${signal}.`));
      else if (code === 0) resolvePromise();
      else reject(new Error(`El proceso terminó con código ${code ?? "desconocido"}.`));
    });
  });
}

function assertPortAvailable() {
  return new Promise<void>((resolvePromise, reject) => {
    const socket = connect({ host: "127.0.0.1", port: e2ePort });
    socket.setTimeout(750);
    socket.once("connect", () => {
      socket.destroy();
      reject(new Error("El puerto E2E dedicado ya está ocupado."));
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolvePromise();
    });
    socket.once("error", () => {
      socket.destroy();
      resolvePromise();
    });
  });
}

async function waitForServer(server: ChildProcess) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error("Next terminó antes de responder el health check.");
    }
    try {
      const response = await fetch(`${baseUrl}/api/health/live`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2_000),
      });
      const body = (await response.json()) as { status?: unknown };
      if (
        response.ok &&
        body.status === "live" &&
        response.headers.get("cache-control")?.includes("no-store")
      ) {
        return;
      }
    } catch {
      // El servidor aún está iniciando; el límite total controla esta espera.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error("Next no respondió con el health local esperado en 60 segundos.");
}

function stopOwnedServer(server: ChildProcess | undefined) {
  if (!server?.pid || server.exitCode !== null || server.signalCode !== null) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}

async function main() {
  await assertPortAvailable();
  await run(process.execPath, [nextCli, "build"]);

  let server: ChildProcess | undefined;
  const terminate = () => stopOwnedServer(server);
  process.once("SIGINT", terminate);
  process.once("SIGTERM", terminate);
  try {
    server = spawn(
      process.execPath,
      [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(e2ePort)],
      {
        cwd: workspaceRoot,
        detached: true,
        env: process.env,
        stdio: "inherit",
      },
    );
    server.once("error", (error) => {
      console.error(`No se pudo iniciar Next: ${error.message}`);
    });
    await waitForServer(server);
    await run(python, [e2eScript]);
  } finally {
    stopOwnedServer(server);
    process.removeListener("SIGINT", terminate);
    process.removeListener("SIGTERM", terminate);
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? `E2E CI rechazado: ${error.message}`
      : "E2E CI rechazado por un error desconocido.",
  );
  process.exitCode = 1;
});
