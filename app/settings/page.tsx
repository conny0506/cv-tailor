"use client";

import { useEffect, useState } from "react";

interface Status {
  synced: boolean;
  username?: string;
  synced_at?: string;
  repo_count?: number;
  repos?: { name: string; language: string | null; stars: number; has_readme: boolean }[];
}

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/github/sync");
    setStatus(await r.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function sync() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          username: username || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "sync failed");
      setMsg(
        `✓ ${j.repo_count} repo senkronlandı (${j.repos_with_readme} README ile). Username: ${j.username}`
      );
      await refresh();
    } catch (e) {
      setMsg(`✗ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <h1 className="text-2xl font-bold mb-1">Ayarlar</h1>
        <p className="text-slate-600 text-sm">
          API anahtarları <code className="bg-slate-200 px-1 rounded">.env.local</code>{" "}
          dosyasında tutulur. Buradan girdiğinizde sadece o seansa özel kullanılır (kalıcı
          değildir).
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <h2 className="font-semibold">GitHub Senkron</h2>

        <Field
          label="GitHub Personal Access Token (opsiyonel — public repolar için gerek yok ama rate-limit için tavsiye edilir)"
          value={token}
          onChange={setToken}
          type="password"
          placeholder="ghp_..."
        />
        <Field
          label="Kullanıcı adı (boş bırakırsanız cv.json'daki github URL'sinden alınır)"
          value={username}
          onChange={setUsername}
          placeholder="conny0506"
        />
        <button
          onClick={sync}
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Senkronlanıyor..." : "GitHub'ı Senkronla"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded p-5 space-y-3">
        <h2 className="font-semibold">Mevcut Cache</h2>
        {status?.synced ? (
          <>
            <p className="text-sm text-slate-700">
              <b>{status.username}</b> · {status.repo_count} repo · son sync{" "}
              {status.synced_at
                ? new Date(status.synced_at).toLocaleString("tr-TR")
                : "-"}
            </p>
            <ul className="text-xs text-slate-600 space-y-1 max-h-72 overflow-auto">
              {status.repos?.map((r) => (
                <li key={r.name}>
                  <span className={r.has_readme ? "text-slate-700" : "text-slate-400"}>
                    {r.has_readme ? "📄" : "·"} {r.name}
                  </span>{" "}
                  <span className="text-slate-400">
                    ({r.language ?? "?"}, ★{r.stars})
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-slate-500">Henüz cache yok.</p>
        )}
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-900">
        <b>Anthropic API Key:</b> <code>.env.local</code> içine{" "}
        <code>ANTHROPIC_API_KEY=sk-ant-...</code> ekleyip dev server&apos;ı yeniden başlatın.
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono"
      />
    </label>
  );
}
