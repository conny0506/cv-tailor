import type { NextRequest } from "next/server";
import { readBaseCV, readGeneration } from "@/lib/storage";
import { renderPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/cv/pdf/[id]">) {
  const { id } = await ctx.params;
  const gen = await readGeneration(id);
  if (!gen) return new Response("Not found", { status: 404 });
  const cv = await readBaseCV();
  const pdf = await renderPdf(cv, gen);

  const slug =
    (gen.analysis?.role ?? "genel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "cv";
  const filename = `Mustafa_Dinc_CV_${slug}_${gen.language}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
