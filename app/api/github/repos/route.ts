import { readGithubCache } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cache = await readGithubCache();
    if (!cache) {
      return Response.json({ repos: [], synced_at: null });
    }
    const repos = cache.repos.map((r) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      language: r.language,
      topics: r.topics,
      stargazers_count: r.stargazers_count,
      pushed_at: r.pushed_at,
    }));
    return Response.json({ repos, synced_at: cache.synced_at });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
