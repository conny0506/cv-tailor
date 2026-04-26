import { structuredCall } from "./claude";
import { JobAnalysis } from "./schema";

const SYSTEM = `You are an expert technical recruiter. Given a job posting (in any language), extract a structured analysis. Be precise: list ONLY the technical skills/tools/languages explicitly stated. Do not invent. Distinguish "must have" (required, mandatory, "şart") from "nice to have" (preferred, plus, "tercih sebebi"). Detect the language the posting is written in.`;

export async function analyzeJob(jobText: string): Promise<JobAnalysis> {
  return structuredCall({
    system: SYSTEM,
    user: `<job_posting>\n${jobText}\n</job_posting>`,
    toolName: "return_job_analysis",
    toolDescription: "Return a structured analysis of the job posting.",
    schema: JobAnalysis,
    inputSchema: {
      properties: {
        role: { type: "string", description: "Job title, e.g. 'Junior Backend Engineer'" },
        seniority: {
          type: "string",
          enum: ["intern", "junior", "mid", "senior", "lead", "unknown"],
        },
        domain: {
          type: "string",
          description: "Primary domain, e.g. 'fintech', 'embedded', 'ai/ml', 'web full-stack'",
        },
        must_have_skills: {
          type: "array",
          items: { type: "string" },
          description:
            "Required skills/tools/languages. Use the exact wording from the posting (e.g. 'PostgreSQL' not 'Postgres').",
        },
        nice_to_have_skills: {
          type: "array",
          items: { type: "string" },
          description: "Preferred but not required skills.",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description:
            "10-25 highest-signal ATS keywords from the posting (mix of skills, methodologies, domain terms). Use the posting's exact wording.",
        },
        language_detected: {
          type: "string",
          enum: ["tr", "en"],
          description: "Language the posting is written in.",
        },
      },
      required: [
        "role",
        "seniority",
        "domain",
        "must_have_skills",
        "nice_to_have_skills",
        "keywords",
        "language_detected",
      ],
    },
  });
}
