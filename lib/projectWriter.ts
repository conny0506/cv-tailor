import { structuredCall, UsageAccumulator } from "./claude";
import { RepoEntry, SelectedProject } from "./schema";
import { z } from "zod";

const SYSTEM = `You are an expert technical resume writer. Given a developer's GitHub project README, write 3-5 concise resume bullets that highlight what was built, the technologies used, and any notable outcomes or features.

Rules:
1. NEVER invent features not mentioned in the README.
2. Each bullet is 1-2 lines, action-verb led (e.g. "Developed", "Built", "Implemented").
3. Quantify impact when data is available in the README (stars, users, performance metrics, etc.).
4. Write in the requested output language (Turkish or English).
5. If the README is very short, write 2-3 solid bullets rather than padding.`;

const ProjectsArray = z.object({ projects: z.array(SelectedProject) });

export async function writeProjects(opts: {
  repos: RepoEntry[];
  targetLanguage: "tr" | "en";
  usageAccumulator?: UsageAccumulator;
}): Promise<SelectedProject[]> {
  const repoBlock = opts.repos
    .map(
      (r) =>
        `## Repo: ${r.name}\nLanguage: ${r.language ?? "unknown"} | Stars: ${r.stargazers_count} | Topics: ${r.topics.join(", ") || "-"}\nURL: ${r.html_url}\nDescription: ${r.description ?? "-"}\n\nREADME:\n${r.readme.slice(0, 8000)}`
    )
    .join("\n\n---\n\n");

  const userText = `Write resume bullets for each of the following ${opts.repos.length} project(s). Output language: ${opts.targetLanguage === "tr" ? "Turkish" : "English"}.

${repoBlock}

Return all ${opts.repos.length} project(s) via the tool call.`;

  const result = await structuredCall({
    system: SYSTEM,
    user: userText,
    toolName: "return_written_projects",
    toolDescription: "Return resume bullets for the given projects.",
    schema: ProjectsArray,
    usageAccumulator: opts.usageAccumulator,
    inputSchema: {
      properties: {
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              repo_name: { type: "string", description: "Exact repo name" },
              title: { type: "string", description: "Display title in target language" },
              stack: {
                type: "array",
                items: { type: "string" },
                description: "Tech stack labels (only those actually used in the README)",
              },
              bullets: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
                description: "3-5 resume bullets in target language",
              },
              why_relevant: {
                type: "string",
                description: "Brief note on what the project demonstrates (internal use)",
              },
            },
            required: ["repo_name", "title", "stack", "bullets", "why_relevant"],
          },
        },
      },
      required: ["projects"],
    },
  });

  return result.projects;
}
