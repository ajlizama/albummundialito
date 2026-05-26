import { buildICS } from "@/lib/fixture-ics";

export const dynamic = "force-static";

export async function GET() {
  const ics = buildICS();
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mundial-2026.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
