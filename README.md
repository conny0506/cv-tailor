# CV Tailor

İlana özel, ATS-uyumlu CV üretici. CV'nin **sabit bölümleri** (kişisel bilgi, eğitim, iş deneyimi, ödüller, yetenekler, diller) `data/cv.json`'da bir kez tanımlanır; her başvuruda yalnızca **Projelerim** bölümü, GitHub portfolyonun gerçek README'lerinden seçilerek ilanın diline göre yeniden yazılır.

## Çalıştırma

```bash
# 1) Bağımlılıklar
npm install

# 2) Anahtarlar
cp .env.local.example .env.local
# .env.local içine ANTHROPIC_API_KEY ve (opsiyonel) GITHUB_PAT yaz

# 3) Taban CV
cp data/cv.example.json data/cv.json
# data/cv.json'u kendine göre güncelle (zaten örnek dolu)

# 4) Geliştirme
npm run dev
# http://localhost:3000
```

## Akış

1. **Ayarlar** sayfası → "GitHub'ı Senkronla" → `data/github_cache.json` oluşur (public repolar + README'ler).
2. **Yeni CV Üret** → ilanı yapıştır + dil + şablon seç → ≈30 sn'de sonuç.
3. **Sonuç** sayfası → eşleşen anahtar kelimeler, seçilen projeler, skill-gap önerileri, PDF/HTML çıktı.

## Mimari

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4.
- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) + prompt caching → README cache tek bir efemeral block olarak gönderilir, ardışık çağrılarda %90 ucuz.
- **Octokit** ile GitHub repo + README fetch.
- **Puppeteer** (Chromium) ile HTML şablon → PDF.
- **Zod** ile uçtan uca tip güvenliği (CV şeması, JD analizi, proje, skill-gap).

## Şablonlar

- `ats` (varsayılan): tek-kolon, foto/tablo yok, standart başlıklar, ATS sistemleri için optimize.
- `visual`: koyu mavi başlık şeridi, recruiter okunabilirliği için.

ATS şablonu LinkedIn Easy Apply / Workday / Eightfold AI gibi sistemler için tasarlandı; visual şablon ekrandan/insandan okuyacak yetkililer için.

## Skill Gap

İlan istediği halde GitHub'ında ve CV skill listesinde geçmeyen her teknoloji için:
- önem (must_have / nice_to_have)
- somut bir 1-3 haftalık proje fikri (ad + 2-3 özellik)
- önerilen tech stack
- tahmini süre

## Veri Dosyaları (gitignore'da)

- `data/cv.json` — sabit CV verileri (kişisel bilgi içerir, commit etme).
- `data/github_cache.json` — sync edilmiş repo + README cache.
- `data/generations/<uuid>.json` — her üretimin tam çıktısı (analiz + projeler + gap).

## Hallüsinasyon Koruması

`projectSelector` sistem talimatı net: README'de geçmeyen bir kütüphane/özellik bullet'a yazılamaz. Yine de üretilen CV'yi göndermeden önce gözden geçir.
