import type { NextRequest } from "next/server";
import { readBaseCV, readGeneration } from "@/lib/storage";
import { renderHtml } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/cv/preview/[id]">) {
  const { id } = await ctx.params;
  const gen = await readGeneration(id);
  if (!gen) return new Response("Not found", { status: 404 });
  const cv = await readBaseCV();
  const html = renderHtml(cv, gen);
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
