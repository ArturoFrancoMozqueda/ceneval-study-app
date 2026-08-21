import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const healthProbePaths = new Set([
  "/api/health/live",
  "/api/health/ready",
]);

export async function proxyWithSessionUpdater(
  request: NextRequest,
  sessionUpdater: typeof updateSession,
) {
  if (healthProbePaths.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return sessionUpdater(request);
}

export async function proxy(request: NextRequest) {
  return proxyWithSessionUpdater(request, updateSession);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
