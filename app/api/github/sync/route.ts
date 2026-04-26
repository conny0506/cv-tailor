import { NextRequest } from "next/server";
import { syncGithub } from "@/lib/github";
import { writeGithubCache, readBaseCV } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token as string | undefined) ?? process.env.GITHUB_PAT;
    let username = body.username as string | undefined;

    if (!username) {
      const cv = await readBaseCV();
      const url = new URL(cv.personal.contact.github);
      username = url.pathname.replace(/^\/+/, "").split("/")[0];
    }

    if (!username) {
      return Response.json({ error: "GitHub username could not be determined" }, { status: 400 });
    }

    const cache = await syncGithub({ username, token });
    await writeGithubCache(cache);
    return Response.json({
      ok: true,
      username: cache.username,
      synced_at: cache.synced_at,
      repo_count: cache.repos.length,
      repos_with_readme: cache.repos.filter((r) => r.readme.trim().length > 0).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { readGithubCache } = await import("@/lib/storage");
  const cache = await readGithubCache();
  if (!cache) return Response.json({ synced: false });
  return Response.json({
    synced: true,
    username: cache.username,
    synced_at: cache.synced_at,
    repo_count: cache.repos.length,
    repos: cache.repos.map((r) => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      has_readme: r.readme.trim().length > 0,
    })),
  });
}
