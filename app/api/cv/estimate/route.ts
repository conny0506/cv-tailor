import { NextRequest } from "next/server";
import { readGithubCache } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Sonnet 4.6 fiyatları ($/1M token)
const PRICE_INPUT = 3.0;
const PRICE_OUTPUT = 15.0;
const PRICE_CACHE_WRITE = 3.75;
const PRICE_CACHE_READ = 0.30;

// Sabit sistem prompt büyüklükleri (karakter → token: chars/4)
const FIXED_SYSTEM_CALL1 = 600;   // analyzeJob system
const FIXED_OUTPUT_CALL1 = 500;
const FIXED_SYSTEM_CALL2 = 300;   // selectProjects system head
const FIXED_USER_CALL2 = 250;     // selectProjects user (job summary)
const FIXED_OUTPUT_CALL2 = 1200;
const FIXED_SYSTEM_CALL3 = 800;   // findGaps system
const FIXED_USER_CALL3 = 400;     // findGaps user (job + inventory header)
const FIXED_OUTPUT_CALL3 = 700;

function c2t(chars: number): number {
  return Math.ceil(chars / 4);
}

export async function POST(req: NextRequest) {
  try {
    const { job_text } = await req.json();
    if (!job_text || typeof job_text !== "string") {
      return Response.json({ error: "job_text zorunlu" }, { status: 400 });
    }

    const cache = await readGithubCache();
    const jobTokens = c2t(job_text.length);

    // Call 1: analyzeJob
    const c1Input = FIXED_SYSTEM_CALL1 + jobTokens;
    const c1Output = FIXED_OUTPUT_CALL1;

    // Call 2: selectProjects — README cache (max 8000 chars/repo, ephemeral cached)
    let readmeChars2 = 0;
    let repoCount = 0;
    if (cache) {
      repoCount = cache.repos.length;
      readmeChars2 = cache.repos
        .filter((r) => r.readme.trim().length > 50)
        .reduce((sum, r) => sum + Math.min(r.readme.length, 8000), 0);
    }
    const readmeTokens2 = c2t(readmeChars2);
    // README block is ephemeral-cached: first call = cache write, subsequent = cache read
    const c2Input = FIXED_SYSTEM_CALL2 + readmeTokens2 + FIXED_USER_CALL2;
    const c2Output = FIXED_OUTPUT_CALL2;

    // Call 3: findGaps — first 1500 chars per readme
    let readmeChars3 = 0;
    if (cache) {
      readmeChars3 = cache.repos.reduce((sum, r) => sum + Math.min(r.readme.length, 1500), 0);
    }
    const c3Input = FIXED_SYSTEM_CALL3 + c2t(readmeChars3) + FIXED_USER_CALL3;
    const c3Output = FIXED_OUTPUT_CALL3;

    const totalInput = c1Input + c2Input + c3Input;
    const totalOutput = c1Output + c2Output + c3Output;
    const totalTokens = totalInput + totalOutput;

    // Maliyet: README cache'i cache-write olarak hesapla (ilk üretim, sonrakiler daha ucuz)
    const costInput = ((totalInput - readmeTokens2) / 1_000_000) * PRICE_INPUT;
    const costCacheWrite = (readmeTokens2 / 1_000_000) * PRICE_CACHE_WRITE;
    const costOutput = (totalOutput / 1_000_000) * PRICE_OUTPUT;
    const estimatedCostUsd = costInput + costCacheWrite + costOutput;

    // Sonraki üretimde README cache okunursa (cache hit) ne kadar olur?
    const costCachedInput = ((totalInput - readmeTokens2) / 1_000_000) * PRICE_INPUT;
    const costCacheRead = (readmeTokens2 / 1_000_000) * PRICE_CACHE_READ;
    const estimatedCostCachedUsd = costCachedInput + costCacheRead + costOutput;

    return Response.json({
      total_tokens: totalTokens,
      input_tokens: totalInput,
      output_tokens: totalOutput,
      readme_tokens: readmeTokens2,
      job_tokens: jobTokens,
      repo_count: repoCount,
      estimated_cost_usd: estimatedCostUsd,
      estimated_cost_cached_usd: estimatedCostCachedUsd,
      has_cache: cache !== null,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
