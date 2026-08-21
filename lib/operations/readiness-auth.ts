import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function hasValidReadinessAuthorization(
  authorization: string | null,
  expectedToken: string | undefined,
) {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expected = expectedToken?.trim() ?? "";
  if (!token || expected.length < 32) return false;
  return timingSafeEqual(digest(token), digest(expected));
}
