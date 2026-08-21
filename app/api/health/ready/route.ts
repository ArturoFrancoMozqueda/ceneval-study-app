import { hasValidReadinessAuthorization } from "@/lib/operations/readiness-auth";
import { validateRuntimeEnvironment } from "@/lib/operations/runtime-env";
import { writeOperationalLog } from "@/lib/operations/safe-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET(request: Request) {
  if (
    !hasValidReadinessAuthorization(
      request.headers.get("authorization"),
      process.env.OPS_READINESS_TOKEN,
    )
  ) {
    return Response.json({ status: "not_found" }, { headers: responseHeaders, status: 404 });
  }

  const startedAt = Date.now();
  try {
    const config = validateRuntimeEnvironment(process.env);
    const response = await fetch(`${config.supabaseUrl}/rest/v1/profiles?select=id&limit=0`, {
      cache: "no-store",
      headers: {
        apikey: config.secretKey,
        Authorization: `Bearer ${config.secretKey}`,
      },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw { code: `HTTP${response.status}` };
    writeOperationalLog({
      durationMs: Date.now() - startedAt,
      event: "readiness_check",
      level: "info",
      status: "ready",
    });
    return Response.json({ status: "ready" }, { headers: responseHeaders });
  } catch (error: unknown) {
    writeOperationalLog({
      durationMs: Date.now() - startedAt,
      error,
      event: "readiness_check",
      level: "error",
      status: "failed",
    });
    return Response.json({ status: "not_ready" }, { headers: responseHeaders, status: 503 });
  }
}
