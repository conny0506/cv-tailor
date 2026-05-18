import { structuredCall, UsageAccumulator } from "./claude";
import { BaseCV, SelectedProject } from "./schema";
import { z } from "zod";

const SYSTEM = `You are an expert technical resume writer. Given a developer's base CV and the projects selected for a specific CV, you write:
1. A tailored profile summary that highlights the skills and experience most relevant to those projects.
2. A trimmed, reordered skills section that puts the most relevant skill categories and tools first.

Rules:
- The summary MUST mention that the candidate is based in Ankara (Ankara'da ikamet etmektedir / based in Ankara, Turkey).
- Never invent skills or experiences not present in the base CV.
- Summary: 3-5 sentences, written in first person, natural tone.
- Skills: keep ALL existing categories but reorder items within each category so the most relevant ones appear first. Drop items that have zero relevance to the selected projects.
- Output BOTH Turkish and English versions for everything.`;

const TailoredOutput = z.object({
  summary_tr: z.string(),
  summary_en: z.string(),
  skills: z.array(
    z.object({
      label_tr: z.string(),
      label_en: z.string(),
      items: z.array(z.string()),
    })
  ),
});
type TailoredOutput = z.infer<typeof TailoredOutput>;

export interface TailoredContent {
  summary: { tr: string; en: string };
  skills: { label: { tr: string; en: string }; items: string[] }[];
}

export async function generateTailoredContent(opts: {
  cv: BaseCV;
  projects: SelectedProject[];
  usageAccumulator?: UsageAccumulator;
}): Promise<TailoredContent> {
  const projectBlock = opts.projects
    .map((p) => `- ${p.title} [${p.stack.join(", ")}]: ${p.why_relevant}`)
    .join("\n");

  const baseSkillsBlock = opts.cv.skills
    .map((s) => `${s.label.tr} / ${s.label.en}: ${s.items.join(", ")}`)
    .join("\n");

  const userText = `Base CV summary (TR): ${opts.cv.summary.tr}

Base CV summary (EN): ${opts.cv.summary.en}

Selected projects for this CV:
${projectBlock}

Base skills:
${baseSkillsBlock}

Generate a tailored profile summary and reordered skills section. Remember to mention Ankara residence in both languages.`;

  const result = await structuredCall({
    system: SYSTEM,
    user: userText,
    toolName: "return_tailored_content",
    toolDescription: "Return tailored profile summary and skills for the resume.",
    schema: TailoredOutput,
    usageAccumulator: opts.usageAccumulator,
    inputSchema: {
      properties: {
        summary_tr: { type: "string", description: "Tailored profile summary in Turkish, mentioning Ankara." },
        summary_en: { type: "string", description: "Tailored profile summary in English, mentioning Ankara." },
        skills: {
          type: "array",
          description: "Reordered and trimmed skill categories.",
          items: {
            type: "object",
            properties: {
              label_tr: { type: "string" },
              label_en: { type: "string" },
              items: { type: "array", items: { type: "string" } },
            },
            required: ["label_tr", "label_en", "items"],
          },
        },
      },
      required: ["summary_tr", "summary_en", "skills"],
    },
  });

  const skills = result.skills.map((s) => ({
    label: { tr: s.label_tr, en: s.label_en },
    items: s.items,
  }));

  return {
    summary: { tr: result.summary_tr, en: result.summary_en },
    skills,
  };
}
