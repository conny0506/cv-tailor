import { notFound } from "next/navigation";
import { readGeneration } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gen = await readGeneration(id);
  if (!gen) notFound();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold mb-1">{gen.analysis.role}</h1>
        <p className="text-sm text-slate-600">
          {gen.analysis.seniority} · {gen.analysis.domain} · ilan dili:{" "}
          {gen.analysis.language_detected.toUpperCase()} · CV dili: {gen.language.toUpperCase()} ·{" "}
          şablon: {gen.template}
        </p>
        <div className="mt-3 flex gap-3">
          <a
            href={`/api/cv/pdf/${gen.id}`}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            PDF İndir / Aç
          </a>
          <a
            href={`/api/cv/preview/${gen.id}`}
            target="_blank"
            rel="noreferrer"
            className="border border-slate-300 px-4 py-2 rounded text-sm font-medium hover:bg-slate-100"
          >
            HTML Önizle
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <h2 className="font-semibold">Eşleşen Anahtar Kelimeler</h2>
          <div className="flex flex-wrap gap-1.5">
            {gen.analysis.keywords.map((k) => (
              <span
                key={k}
                className="bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded border border-blue-200"
              >
                {k}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-500 space-y-1 pt-2">
            <div>
              <b>Must-have:</b> {gen.analysis.must_have_skills.join(", ") || "—"}
            </div>
            <div>
              <b>Nice-to-have:</b> {gen.analysis.nice_to_have_skills.join(", ") || "—"}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <h2 className="font-semibold">Seçilen Projeler ({gen.projects.length})</h2>
          <ul className="space-y-3">
            {gen.projects.map((p) => (
              <li key={p.repo_name} className="border-l-2 border-blue-400 pl-3">
                <div className="font-medium text-sm">{p.title}</div>
                <div className="text-xs text-slate-500">
                  repo: {p.repo_name} · {p.stack.join(", ")}
                </div>
                <div className="text-xs text-slate-600 italic mt-1">{p.why_relevant}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded p-5 space-y-3">
        <h2 className="font-semibold text-amber-900">
          Skill Gap: GitHub&apos;ında eksik olabilecek alanlar
        </h2>
        {gen.gaps.length === 0 ? (
          <p className="text-sm text-amber-800">
            Bu ilan için belirgin bir eksik tespit edilmedi.
          </p>
        ) : (
          <ul className="space-y-3">
            {gen.gaps.map((g, i) => (
              <li key={i} className="bg-white rounded p-3 border border-amber-200">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-sm">
                    {g.missing_skill}{" "}
                    <span
                      className={
                        "text-xs px-1.5 py-0.5 rounded " +
                        (g.importance === "must_have"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800")
                      }
                    >
                      {g.importance === "must_have" ? "must-have" : "nice-to-have"}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500">{g.estimated_effort}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{g.project_idea}</p>
                <div className="text-xs text-slate-500 mt-1">
                  Stack: {g.suggested_stack.join(", ")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="bg-white border border-slate-200 rounded p-4">
        <summary className="font-semibold text-sm cursor-pointer">
          İlan metni ({gen.job_text.length} karakter)
        </summary>
        <pre className="text-xs whitespace-pre-wrap mt-3 text-slate-700">{gen.job_text}</pre>
      </details>
    </div>
  );
}
