const INTERNAL_ORIGIN = "https://internal.invalid";

export function safeInternalPath(value: string | null): string {
  if (
    !value ||
    !/^\/(?![\\/])/.test(value) ||
    value.includes("\\") ||
    /%(?:2f|5c)/i.test(value)
  ) {
    return "/";
  }

  try {
    const destination = new URL(value, INTERNAL_ORIGIN);
    if (destination.origin !== INTERNAL_ORIGIN) return "/";

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}
