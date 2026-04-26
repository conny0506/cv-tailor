import { BaseCV, Generation } from "@/lib/schema";

export function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pick<T extends { tr: string; en: string }>(b: T, lang: "tr" | "en"): string {
  return b[lang];
}

export function pickArr(b: { tr: string[]; en: string[] }, lang: "tr" | "en"): string[] {
  return b[lang];
}

export function sectionLabels(lang: "tr" | "en") {
  return lang === "tr"
    ? {
        summary: "Profil Özeti",
        education: "Eğitim Bilgileri",
        experience: "İş Deneyimi",
        awards: "Ödüller / Yarışmalar",
        projects: "Projelerim",
        skills: "Yetenekler",
        languages: "Yabancı Diller",
      }
    : {
        summary: "Profile Summary",
        education: "Education",
        experience: "Experience",
        awards: "Awards / Competitions",
        projects: "Projects",
        skills: "Skills",
        languages: "Languages",
      };
}

export interface RenderInput {
  cv: BaseCV;
  gen: Generation;
}
