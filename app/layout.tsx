import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "CV Tailor",
  description: "İlana özel, ATS-uyumlu CV üretici",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold text-slate-900">
              CV Tailor
            </Link>
            <Link href="/generate" className="text-slate-700 hover:text-slate-900">
              İlana Özel CV
            </Link>
            <Link href="/pick" className="text-slate-700 hover:text-slate-900">
              Proje Seç
            </Link>
            <Link href="/settings" className="text-slate-700 hover:text-slate-900">
              Ayarlar
            </Link>
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
