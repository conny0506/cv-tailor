"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RepoSummary {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  pushed_at: string;
}

export default function PickPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [template, setTemplate] = useState<"ats" | "visual">("ats");
  const [busy, setBusy] = useState(false);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((d) => {
        setRepos(d.repos ?? []);
        setSyncedAt(d.synced_at ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/cv/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_names: Array.from(selected),
          language,
          template,
          force: forceRegenerate,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "üretim başarısız");
      router.push(`/result/${j.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h1 className="text-2xl font-bold mb-1">Proje Seç — CV Üret</h1>
        <p className="text-slate-600 text-sm">
          Hangi projelerinin CV&apos;de yer alacağını seç (en fazla 6). İş ilanı gerekmez; Claude her
          proje için özgeçmiş bullet&apos;ları otomatik yazar.
        </p>
      </section>

      {loading && <p className="text-slate-500 text-sm">Repolar yükleniyor…</p>}

      {!loading && repos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800">
          GitHub cache boş.{" "}
          <a href="/settings" className="underline font-medium">
            /settings
          </a>{" "}
          sayfasından senkronize edin.
        </div>
      )}

      {!loading && repos.length > 0 && (
        <>
          {syncedAt && (
            <p className="text-xs text-slate-400">Son senkronizasyon: {fmtDate(syncedAt)}</p>
          )}

          <div className="space-y-2">
            {repos.map((repo) => {
              const checked = selected.has(repo.name);
              return (
                <label
                  key={repo.name}
                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    checked
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(repo.name)}
                    className="mt-1 accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">{repo.name}</span>
                      {repo.language && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span className="text-xs text-slate-400">★ {repo.stargazers_count}</span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">
                        {fmtDate(repo.pushed_at)}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{repo.description}</p>
                    )}
                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {repo.topics.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{selected.size}</span> / 6 proje seçildi
              {selected.size > 6 && (
                <span className="text-red-600 ml-2">— en fazla 6 seçebilirsiniz</span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">CV Dili</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "tr" | "en")}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">İngilizce</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">Şablon</span>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as "ats" | "visual")}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  <option value="ats">ATS-uyumlu (öneri — robot okur)</option>
                  <option value="visual">Görsel (mavi başlık, insan okur)</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={forceRegenerate}
                onChange={(e) => setForceRegenerate(e.target.checked)}
                className="accent-blue-600"
              />
              Önbelleği yok say, Claude&apos;a tekrar yazdır (API kullanır)
            </label>

            <button
              onClick={submit}
              disabled={busy || selected.size === 0 || selected.size > 6}
              className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium disabled:opacity-50"
            >
              {busy ? "Hazırlanıyor…" : "Seçilen Projelerle CV Üret"}
            </button>
            <p className="text-xs text-slate-400">
              Aynı seçim daha önce üretildiyse anında önbellekten gelir, API ücreti alınmaz (30 gün
              boyunca).
            </p>
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
