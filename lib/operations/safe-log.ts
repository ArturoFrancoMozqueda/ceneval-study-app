type OperationalLevel = "error" | "info";
type OperationalEvent = "readiness_check";
type OperationalStatus = "failed" | "ready";

const allowedErrorCodes = /^[A-Z0-9]{1,10}$/;

export function classifyOperationalError(error: unknown) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return { errorKind: "timeout" as const };
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "").toUpperCase();
    if (allowedErrorCodes.test(code)) {
      return { errorCode: code, errorKind: "dependency" as const };
    }
  }
  return { errorKind: "unknown" as const };
}

export function writeOperationalLog(input: {
  durationMs: number;
  error?: unknown;
  event: OperationalEvent;
  level: OperationalLevel;
  status: OperationalStatus;
}) {
  const entry = {
    durationMs: Math.max(0, Math.round(input.durationMs)),
    event: input.event,
    level: input.level,
    status: input.status,
    ...(input.error === undefined ? {} : classifyOperationalError(input.error)),
  };
  const line = JSON.stringify(entry);
  if (input.level === "error") console.error(line);
  else console.log(line);
}

function safeOperation(operation: string) {
  return /^[A-Za-z][A-Za-z0-9 _-]{0,63}$/.test(operation)
    ? operation
    : "unknown";
}

export function writeDependencyFailure(input: {
  error?: unknown;
  level?: OperationalLevel;
  operation: string;
}) {
  const entry = {
    ...classifyOperationalError(input.error),
    event: "dependency_failure",
    level: input.level ?? "error",
    operation: safeOperation(input.operation),
    status: "failed",
  };
  const line = JSON.stringify(entry);
  if (input.level === "info") console.log(line);
  else console.error(line);
}
