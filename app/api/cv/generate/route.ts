import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { readBaseCV, readGithubCache, writeGeneration } from "@/lib/storage";
import { analyzeJob } from "@/lib/jobAnalyzer";
import { selectProjects } from "@/lib/projectSelector";
import { findGaps } from "@/lib/skillGap";
import { Generation } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobText = (body.job_text as string | undefined)?.trim();
    const language = body.language === "en" ? "en" : "tr";
    const template = body.template === "visual" ? "visual" : "ats";

    if (!jobText || jobText.length < 50) {
      return Response.json({ error: "job_text is required (min 50 chars)" }, { status: 400 });
    }

    const cv = await readBaseCV();
    const cache = await readGithubCache();
    if (!cache) {
      return Response.json(
        { error: "GitHub cache empty. Run sync first from /settings." },
        { status: 400 }
      );
    }

    const analysis = await analyzeJob(jobText);
    const projects = await selectProjects({ cache, analysis, targetLanguage: language });
    const gaps = await findGaps({ cv, cache, analysis, selected: projects });

    const gen: Generation = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      language,
      template,
      job_text: jobText,
      analysis,
      projects,
      gaps,
    };
    await writeGeneration(gen);

    return Response.json({ id: gen.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
