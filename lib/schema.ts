import { z } from "zod";

export const Bilingual = z.object({ tr: z.string(), en: z.string() });
export type Bilingual = z.infer<typeof Bilingual>;

export const Contact = z.object({
  phone: z.string(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  location: z.string().optional(),
});

export const Personal = z.object({
  name: z.string(),
  title: Bilingual,
  contact: Contact,
});

export const Education = z.object({
  school: z.string(),
  degree: Bilingual,
  start: z.string(),
  end: z.string(),
});

export const Experience = z.object({
  company: z.string(),
  role: Bilingual,
  start: z.string(),
  end: z.string(),
  bullets: z.object({ tr: z.array(z.string()), en: z.array(z.string()) }),
});

export const Award = z.object({
  title: z.string(),
  date: z.string(),
  bullets: z.object({ tr: z.array(z.string()), en: z.array(z.string()) }),
});

export const SkillCategory = z.object({
  label: Bilingual,
  items: z.array(z.string()),
});

export const Language = z.object({
  name: Bilingual,
  level: Bilingual,
});

export const BaseCV = z.object({
  personal: Personal,
  summary: Bilingual,
  education: z.array(Education),
  experience: z.array(Experience),
  awards: z.array(Award),
  skills: z.array(SkillCategory),
  languages: z.array(Language),
});
export type BaseCV = z.infer<typeof BaseCV>;

export const RepoEntry = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  stargazers_count: z.number(),
  pushed_at: z.string(),
  readme: z.string(),
});
export type RepoEntry = z.infer<typeof RepoEntry>;

export const GithubCache = z.object({
  username: z.string(),
  synced_at: z.string(),
  repos: z.array(RepoEntry),
});
export type GithubCache = z.infer<typeof GithubCache>;

export const JobAnalysis = z.object({
  role: z.string(),
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead", "unknown"]),
  domain: z.string(),
  must_have_skills: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()),
  keywords: z.array(z.string()),
  language_detected: z.enum(["tr", "en"]),
});
export type JobAnalysis = z.infer<typeof JobAnalysis>;

export const SelectedProject = z.object({
  repo_name: z.string(),
  title: z.string(),
  stack: z.array(z.string()),
  bullets: z.array(z.string()),
  why_relevant: z.string(),
});
export type SelectedProject = z.infer<typeof SelectedProject>;

export const SkillGapItem = z.object({
  missing_skill: z.string(),
  importance: z.enum(["must_have", "nice_to_have"]),
  project_idea: z.string(),
  suggested_stack: z.array(z.string()),
  estimated_effort: z.string(),
});
export type SkillGapItem = z.infer<typeof SkillGapItem>;

export const Generation = z.object({
  id: z.string(),
  created_at: z.string(),
  language: z.enum(["tr", "en"]),
  template: z.enum(["ats", "visual"]),
  job_text: z.string(),
  analysis: JobAnalysis,
  projects: z.array(SelectedProject),
  gaps: z.array(SkillGapItem),
});
export type Generation = z.infer<typeof Generation>;
