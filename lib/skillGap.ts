import { z } from "zod";
import { structuredCall } from "./claude";
import { BaseCV, GithubCache, JobAnalysis, SelectedProject, SkillGapItem } from "./schema";

const SYSTEM = `You are a career coach for a software engineering student. Given a target job posting and the candidate's actual portfolio (CV skills + GitHub READMEs), identify which required or preferred skills are MISSING. For each missing skill, propose ONE small, concrete portfolio project the candidate could ship in 1-3 weeks to credibly demonstrate it.

Rules:
- Only flag a skill as missing if it appears nowhere in: CV skills list, project bullets, or any README's tech stack.
- Be honest but not alarmist; do not invent gaps that aren't real.
- Project ideas must be specific (name + 2-3 features + tech stack), not "build a CRUD app".
- Always answer in the candidate's UI language (Turkish).
- Maximum 5 gaps; prioritize must-haves over nice-to-haves.`;

function buildPortfolioInventory(cv: BaseCV, cache: GithubCache, projects: SelectedProject[]): string {
  const cvSkills = cv.skills.flatMap((s) => s.items);
  const repoStacks = cache.repos.flatMap((r) => [r.language ?? "", ...r.topics]).filter(Boolean);
  const projectStacks = projects.flatMap((p) => p.stack);
  const readmeKeywords = cache.repos.map((r) => r.readme.slice(0, 1500)).join("\n---\n");

  return `CV declared skills: ${cvSkills.join(", ")}
GitHub repo languages/topics: ${repoStacks.join(", ")}
Stacks used in selected projects: ${projectStacks.join(", ")}

Compressed README excerpts:
${readmeKeywords}`;
}

const GapsArray = z.object({ gaps: z.array(SkillGapItem) });

export async function findGaps(opts: {
  cv: BaseCV;
  cache: GithubCache;
  analysis: JobAnalysis;
  selected: SelectedProject[];
}): Promise<SkillGapItem[]> {
  const inventory = buildPortfolioInventory(opts.cv, opts.cache, opts.selected);

  const userText = `Target job:
- Role: ${opts.analysis.role}
- Must have: ${opts.analysis.must_have_skills.join(", ")}
- Nice to have: ${opts.analysis.nice_to_have_skills.join(", ")}

Candidate portfolio inventory:
${inventory}

Identify up to 5 missing skills with concrete project suggestions (in Turkish).`;

  const res = await structuredCall({
    system: SYSTEM,
    user: userText,
    toolName: "return_skill_gaps",
    toolDescription: "Return missing skills with project suggestions.",
    schema: GapsArray,
    inputSchema: {
      properties: {
        gaps: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              missing_skill: { type: "string" },
              importance: { type: "string", enum: ["must_have", "nice_to_have"] },
              project_idea: {
                type: "string",
                description:
                  "Specific proje fikri Türkçe: ad + 2-3 özellik + neden bu skili kanıtlar",
              },
              suggested_stack: { type: "array", items: { type: "string" } },
              estimated_effort: {
                type: "string",
                description: "ör. '1 hafta', '2-3 hafta', '1 hafta sonu'",
              },
            },
            required: [
              "missing_skill",
              "importance",
              "project_idea",
              "suggested_stack",
              "estimated_effort",
            ],
          },
        },
      },
      required: ["gaps"],
    },
  });

  return res.gaps;
}
