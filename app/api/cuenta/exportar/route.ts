import { buildAccountExport } from "@/lib/data/account-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// L-4: lets a signed-in student download their own personal data as JSON.
// `requireUser` (inside buildAccountExport) redirects unauthenticated
// visitors to /iniciar-sesion; RLS additionally scopes every query to the
// caller's own rows. Never includes `exam_answer_keys`.
export async function GET() {
  const exportPayload = await buildAccountExport();

  return new Response(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="sube-legal-mis-datos.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
