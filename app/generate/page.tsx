"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePage() {
  const router = useRouter();
  const [jobText, setJobText] = useState("");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [template, setTemplate] = useState<"ats" | "visual">("ats");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
