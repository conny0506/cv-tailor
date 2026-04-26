"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Estimate {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  readme_tokens: number;
  job_tokens: number;
  repo_count: number;
  estimated_cost_usd: number;
  estimated_cost_cached_usd: number;
  has_cache: boolean;
}

function fmt(n: number): string {
  return n.toLocaleString("tr-TR");
}

function fmtCost(usd: number): string {
  if (usd < 0.01) return `~$${(usd * 100).toFixed(2)}¢`;
  return `~$${usd.toFixed(3)}`;
}

export default function GeneratePage() {
  const router = useRouter();
  const [jobText, setJobText] = useState("");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [template, setTemplate] = useState<"ats" | "visual">("ats");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (jobText.trim().length < 50) {
      setEstimate(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setEstimating(true);
      try {
        const r = await fetch("/api/cv/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_text: jobText }),
        });
        if (r.ok) setEstimate(await r.json());
      } finally {
        setEstimating(false);
      }
    }, 600);
  }, [jobText]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_text: jobText, language, template }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "üretim başarısız");
      router.push(`/result/${j.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h1 className="text-2xl font-bold mb-1">İlana Özel CV Üret</h1>
        <p className="text-slate-600 text-sm">
          İş ilanını aşağıya yapıştırın. Sabit bölümleriniz korunur, yalnızca <b>Projelerim</b>{" "}
          bölümü ilana göre yeniden yazılır.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">İş İlanı Metni</span>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="LinkedIn, Kariyer.net veya şirketin sitesinden ilan metnini buraya yapıştırın..."
            rows={14}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono"
          />
          <span className="text-xs text-slate-500">{jobText.length} karakter (min. 50)</span>
        </label>

        {/* Token Tahmini */}
        {(estimate || estimating) && (
          <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Tahmini Token Kullanımı</h3>
              {estimating && (
                <span className="text-xs text-slate-400 animate-pulse">hesaplanıyor…</span>
              )}
            </div>
            {estimate && !estimating && (
              <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">İlan tokenı</span>
                    <span className="ml-2 font-mono font-semibold text-slate-800">
                      {fmt(estimate.job_tokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">README cache</span>
                    <span className="ml-2 font-mono font-semibold text-slate-800">
                      {estimate.has_cache
                        ? `${fmt(estimate.readme_tokens)} tok (${estimate.repo_count} repo)`
                        : "—  (sync yapılmamış)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Toplam input</span>
                    <span className="ml-2 font-mono font-semibold text-slate-800">
                      {fmt(estimate.input_tokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Toplam output</span>
                    <span className="ml-2 font-mono font-semibold text-slate-800">
                      {fmt(estimate.output_tokens)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Tahmini maliyet (bu üretim)</div>
                    <div className="text-lg font-bold text-slate-800">
                      {fmtCost(estimate.estimated_cost_usd)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">Cache hit sonrası</div>
                    <div className="text-sm font-semibold text-green-700">
                      {fmtCost(estimate.estimated_cost_cached_usd)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Tahmini — gerçek kullanım üretim sonrası sonuç sayfasında gösterilir.{" "}
                  <a
                    href="https://console.anthropic.com/settings/billing"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-600"
                  >
                    Kalan bakiye → console.anthropic.com
                  </a>
                </p>
              </>
            )}
          </div>
        )}

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

        <button
          onClick={submit}
          disabled={busy || jobText.trim().length < 50}
          className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium disabled:opacity-50"
        >
          {busy ? "Üretiliyor (≈30 sn)..." : "CV Üret"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>
    </div>
  );
}
