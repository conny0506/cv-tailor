import Link from "next/link";
import { readBaseCV, readGithubCache, listGenerations } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const cv = await readBaseCV().catch(() => null);
  const cache = await readGithubCache();
  const recent = (await listGenerations()).slice(0, 8);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-1">Merhaba {cv?.personal.name ?? "👋"}</h1>
        <p className="text-slate-600">
          Bu araç, CV&apos;nizdeki sabit alanları koruyup yalnızca <b>Projelerim</b> bölümünü her ilana
          özel olarak yeniden üretir.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Taban CV">
          {cv ? (
            <p className="text-sm text-slate-600">
              {cv.experience.length} iş, {cv.education.length} eğitim, {cv.awards.length} ödül,{" "}
              {cv.skills.length} skill kategorisi.
            </p>
          ) : (
            <p className="text-sm text-amber-700">cv.json bulunamadı.</p>
          )}
        </Card>
        <Card title="GitHub Cache">
          {cache ? (
            <p className="text-sm text-slate-600">
              <b>{cache.username}</b>: {cache.repos.length} repo, son sync{" "}
              {new Date(cache.synced_at).toLocaleString("tr-TR")}
            </p>
          ) : (
            <p className="text-sm text-amber-700">
              Henüz sync yapılmadı.{" "}
              <Link href="/settings" className="underline">
                Ayarlar&apos;dan başlat
              </Link>
              .
            </p>
          )}
        </Card>
        <Card title="Hızlı Aksiyon">
          <Link
            href="/generate"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            İlana özel CV üret →
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Son üretilen CV&apos;ler</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz hiç CV üretilmedi.</p>
        ) : (
          <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded">
            {recent.map((g) => (
              <li key={g.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">
                    {g.analysis.role}{" "}
                    <span className="text-xs text-slate-500 uppercase">
                      [{g.language}] {g.template}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(g.created_at).toLocaleString("tr-TR")} · {g.projects.length} proje ·{" "}
                    {g.gaps.length} skill gap
                  </div>
                </div>
                <Link href={`/result/${g.id}`} className="text-sm text-blue-600 hover:underline">
                  Aç →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">{title}</h3>
      {children}
    </div>
  );
}
