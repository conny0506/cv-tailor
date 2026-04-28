import { renderAts } from "./templates/ats";
import { renderVisual } from "./templates/visual";
import { BaseCV, Generation } from "./schema";

export function renderHtml(cv: BaseCV, gen: Generation): string {
  return gen.template === "visual" ? renderVisual({ cv, gen }) : renderAts({ cv, gen });
}

export async function renderPdf(cv: BaseCV, gen: Generation): Promise<Uint8Array> {
  const html = renderHtml(cv, gen);

  let browser;

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { default: puppeteerCore } = await import("puppeteer-core");
    const executablePath = await chromium.executablePath();
    if (!executablePath) {
      throw new Error("Chromium executablePath bulunamadı (Vercel @sparticuz/chromium kurulumu eksik olabilir)");
    }
    browser = await puppeteerCore.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      executablePath,
      headless: true,
    });
  } else {
    const { default: puppeteer } = await import("puppeteer");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return pdf;
  } finally {
    await page.close();
    await browser.close();
  }
}
