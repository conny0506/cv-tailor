import { structuredCall } from "./claude";
import { GithubCache, JobAnalysis, SelectedProject } from "./schema";
import { z } from "zod";

const SYSTEM_HEAD = `You are an expert technical resume writer. From a candidate's GitHub portfolio, you select the 3-5 projects most relevant to a target job posting and rewrite each project's bullets to highlight matching keywords — TRUTHFULLY.

Hard rules:
1. NEVER attribute a technology, library, or feature to a project unless it appears in that project's README.
2. Use the EXACT wording of the job posting's keywords when truthfully applicable (ATS systems weight exact matches).
3. Write bullets in the requested target language (TR or EN).
4. Each bullet should be 1-2 lines, action-verb led, quantified when possible.
5. If fewer than 3 projects in the portfolio truly match, return only those that match — do NOT pad.
6. Order projects by relevance (most relevant first).`;

function buildReadmeBlock(cache: GithubCache): string {
  return cache.repos
    .filter((r) => r.readme.trim().length > 50)
    .map(
      (r) =>
        `## Repo: ${r.name}\nLanguage: ${r.language ?? "unknown"} | Stars: ${r.stargazers_count} | Topics: ${r.topics.join(", ") || "-"}\nURL: ${r.html_url}\nDescription: ${r.description ?? "-"}\n\nREADME:\n${r.readme.slice(0, 8000)}`
    )
    .join("\n\n---\n\n");
}

const ProjectsArray = z.object({ projects: z.array(SelectedProject) });

export async function selectProjects(opts: {
  cache: GithubCache;
  analysis: JobAnalysis;
  targetLanguage: "tr" | "en";
}): Promise<SelectedProject[]> {
  const readmeBlock = buildReadmeBlock(opts.cache);

  const systemBlocks = [
    { type: "text" as const, text: SYSTEM_HEAD },
    {
      type: "text" as const,
      text: `<github_portfolio username="${opts.cache.username}">\n${readmeBlock}\n</github_portfolio>`,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const userText = `Target job analysis:
- Role: ${opts.analysis.role} (${opts.analysis.seniority})
- Domain: ${opts.analysis.domain}
- Must have: ${opts.analysis.must_have_skills.join(", ")}
- Nice to have: ${opts.analysis.nice_to_have_skills.join(", ")}
- ATS keywords: ${opts.analysis.keywords.join(", ")}

Target language for output: ${opts.targetLanguage === "tr" ? "Turkish" : "English"}.

Select 3-5 most relevant projects from the portfolio above. Return them via the tool call.`;

  const result = await structuredCall({
    system: systemBlocks,
    user: userText,
    toolName: "return_selected_projects",
    toolDescription: "Return the selected and rewritten projects for the resume.",
    schema: ProjectsArray,
    inputSchema: {
      properties: {
        projects: {
          type: "array",
          minItems: 0,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              repo_name: { type: "string", description: "Exact repo name from the portfolio" },
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
                description: "3-5 resume bullets in target language, weaving in ATS keywords truthfully",
              },
              why_relevant: {
                type: "string",
                description: "1-sentence rationale (in English, internal-use) for the picker",
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
