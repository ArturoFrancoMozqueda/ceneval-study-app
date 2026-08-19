import "server-only";

export function isPrivateAccessOnly() {
  return process.env.PRIVATE_ACCESS_ONLY !== "false";
}
