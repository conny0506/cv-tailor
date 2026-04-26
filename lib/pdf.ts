import puppeteer, { Browser } from "puppeteer";
import { renderAts } from "./templates/ats";
import { renderVisual } from "./templates/visual";
import { BaseCV, Generation } from "./schema";

let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return _browser;
}

export function renderHtml(cv: BaseCV, gen: Generation): string {
  return gen.template === "visual" ? renderVisual({ cv, gen }) : renderAts({ cv, gen });
}

export async function renderPdf(cv: BaseCV, gen: Generation): Promise<Uint8Array> {
  const html = renderHtml(cv, gen);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return pdf;
  } finally {
    await page.close();
  }
}
