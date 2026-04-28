import fs from "node:fs/promises";
import path from "node:path";
import { BaseCV, GithubCache, Generation } from "./schema";

const IS_VERCEL = Boolean(process.env.VERCEL);

// ─── Local paths ─────────────────────────────────────────────────────────────
const ROOT = path.resolve(process.cwd(), "data");
const CV_PATH = path.join(ROOT, "cv.json");
const CV_EXAMPLE_PATH = path.join(ROOT, "cv.example.json");
const CACHE_PATH = path.join(ROOT, "github_cache.json");
const GEN_DIR = path.join(ROOT, "generations");

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function redis() {
  const { default: Redis } = await import("ioredis");
  return new Redis(process.env.REDIS_URL!);
}

async function redisGet<T>(key: string): Promise<T | null> {
  const client = await redis();
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } finally {
    client.disconnect();
  }
}

async function redisSet(key: string, value: unknown, exSeconds?: number): Promise<void> {
  const client = await redis();
  try {
    const raw = JSON.stringify(value);
    if (exSeconds) {
      await client.setex(key, exSeconds, raw);
    } else {
      await client.set(key, raw);
    }
  } finally {
    client.disconnect();
  }
}

// ─── CV ──────────────────────────────────────────────────────────────────────
export async function readBaseCV(): Promise<BaseCV> {
  if (IS_VERCEL) {
    const raw = process.env.CV_JSON;
    if (!raw) throw new Error("CV_JSON env var is not set — add it in Vercel project settings");
    return BaseCV.parse(JSON.parse(raw));
  }
  const target = await fs.access(CV_PATH).then(() => CV_PATH).catch(() => CV_EXAMPLE_PATH);
  const raw = await fs.readFile(target, "utf8");
  return BaseCV.parse(JSON.parse(raw));
}

export async function writeBaseCV(cv: BaseCV) {
  if (IS_VERCEL) throw new Error("CV güncellemesi Vercel'de desteklenmiyor — CV_JSON env var'ı güncelleyin");
  await ensureDir(ROOT);
  await fs.writeFile(CV_PATH, JSON.stringify(cv, null, 2), "utf8");
}

// ─── GitHub Cache ─────────────────────────────────────────────────────────────
export async function readGithubCache(): Promise<GithubCache | null> {
  if (IS_VERCEL) {
    const data = await redisGet<GithubCache>("github_cache");
    return data;
  }
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return GithubCache.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeGithubCache(cache: GithubCache) {
  if (IS_VERCEL) {
    await redisSet("github_cache", cache);
    return;
  }
  await ensureDir(ROOT);
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

// ─── Generations ──────────────────────────────────────────────────────────────
export async function readGeneration(id: string): Promise<Generation | null> {
  if (IS_VERCEL) {
    return await redisGet<Generation>(`gen:${id}`);
  }
  try {
    const raw = await fs.readFile(path.join(GEN_DIR, `${id}.json`), "utf8");
    return Generation.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeGeneration(gen: Generation) {
  if (IS_VERCEL) {
    // 30 gün TTL — pick önbelleğinin tekrar tekrar API key harcamaması için
    await redisSet(`gen:${gen.id}`, gen, 60 * 60 * 24 * 30);
    return;
  }
  await ensureDir(GEN_DIR);
  await fs.writeFile(path.join(GEN_DIR, `${gen.id}.json`), JSON.stringify(gen, null, 2), "utf8");
}

export async function listGenerations(): Promise<Generation[]> {
  if (IS_VERCEL) return [];
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
