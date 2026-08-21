export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export function GET() {
  return Response.json({ status: "live" }, { headers });
}
