import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { readGeneration, readGithubCache, writeGeneration } from "@/lib/storage";
import { writeProjects } from "@/lib/projectWriter";
import { Generation } from "@/lib/schema";
import type { UsageAccumulator } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function pickId(repoNames: string[], language: string, template: string): string {
  const sorted = [...repoNames].sort();
  const key = `pick:${language}:${template}:${sorted.join(",")}`;
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `pick-${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoNames: string[] = Array.isArray(body.repo_names) ? body.repo_names : [];
    const language = body.language === "en" ? "en" : "tr";
    const template = body.template === "visual" ? "visual" : "ats";
    const force = body.force === true;

    if (repoNames.length === 0) {
      return Response.json({ error: "En az 1 proje seçmelisiniz." }, { status: 400 });
    }
    if (repoNames.length > 6) {
      return Response.json({ error: "En fazla 6 proje seçebilirsiniz." }, { status: 400 });
    }

    const id = pickId(repoNames, language, template);

    // Önbellek kontrolü — aynı seçim daha önce üretildiyse Claude'u tekrar çağırma
    if (!force) {
      const existing = await readGeneration(id);
      if (existing) {
        return Response.json({ id: existing.id, cached: true });
      }
    }

    const cache = await readGithubCache();
    if (!cache) {
      return Response.json(
        { error: "GitHub cache boş. Önce /settings sayfasından senkronize edin." },
        { status: 400 }
      );
    }

    const selectedRepos = cache.repos.filter((r) => repoNames.includes(r.name));
    if (selectedRepos.length === 0) {
      return Response.json({ error: "Seçilen repolar cache'de bulunamadı." }, { status: 400 });
    }

    const usage: UsageAccumulator = {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
    };

    const projects = await writeProjects({ repos: selectedRepos, targetLanguage: language, usageAccumulator: usage });

    const gen: Generation = {
      id,
      created_at: new Date().toISOString(),
      language,
      template,
      projects,
      gaps: [],
      usage,
    };
    await writeGeneration(gen);

    return Response.json({ id: gen.id, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[pick]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
