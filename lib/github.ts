import { Octokit } from "octokit";
import { GithubCache, RepoEntry } from "./schema";

export interface SyncOptions {
  username: string;
  token?: string;
  includeReadme?: boolean;
}

export async function syncGithub({ username, token, includeReadme = true }: SyncOptions): Promise<GithubCache> {
  const octokit = new Octokit({ auth: token });

  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username,
    type: "owner",
    sort: "pushed",
    per_page: 100,
  });

  const entries: RepoEntry[] = [];
  for (const repo of repos) {
    if (repo.fork || repo.archived) continue;

    let readme = "";
    if (includeReadme) {
      try {
        const r = await octokit.rest.repos.getReadme({
          owner: username,
          repo: repo.name,
          mediaType: { format: "raw" },
        });
        readme = typeof r.data === "string" ? r.data : "";
      } catch {
        readme = "";
      }
    }

    entries.push({
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description ?? null,
      html_url: repo.html_url,
      language: repo.language ?? null,
      topics: repo.topics ?? [],
      stargazers_count: repo.stargazers_count ?? 0,
      pushed_at: repo.pushed_at ?? new Date().toISOString(),
      readme,
    });
  }

  return {
    username,
    synced_at: new Date().toISOString(),
    repos: entries,
  };
}
