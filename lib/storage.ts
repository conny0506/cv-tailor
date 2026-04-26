import fs from "node:fs/promises";
import path from "node:path";
import { BaseCV, GithubCache, Generation } from "./schema";

const ROOT = path.resolve(process.cwd(), "data");
const CV_PATH = path.join(ROOT, "cv.json");
const CV_EXAMPLE_PATH = path.join(ROOT, "cv.example.json");
const CACHE_PATH = path.join(ROOT, "github_cache.json");
const GEN_DIR = path.join(ROOT, "generations");

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function readBaseCV(): Promise<BaseCV> {
  const target = await fs
    .access(CV_PATH)
    .then(() => CV_PATH)
    .catch(() => CV_EXAMPLE_PATH);
  const raw = await fs.readFile(target, "utf8");
  return BaseCV.parse(JSON.parse(raw));
}

export async function writeBaseCV(cv: BaseCV) {
  await ensureDir(ROOT);
  await fs.writeFile(CV_PATH, JSON.stringify(cv, null, 2), "utf8");
}

export async function readGithubCache(): Promise<GithubCache | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return GithubCache.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeGithubCache(cache: GithubCache) {
  await ensureDir(ROOT);
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

export async function readGeneration(id: string): Promise<Generation | null> {
  try {
    const raw = await fs.readFile(path.join(GEN_DIR, `${id}.json`), "utf8");
    return Generation.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeGeneration(gen: Generation) {
  await ensureDir(GEN_DIR);
  await fs.writeFile(path.join(GEN_DIR, `${gen.id}.json`), JSON.stringify(gen, null, 2), "utf8");
}

export async function listGenerations(): Promise<Generation[]> {
  try {
    const files = await fs.readdir(GEN_DIR);
    const items = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(GEN_DIR, f), "utf8");
          return Generation.parse(JSON.parse(raw));
        })
    );
    return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}
