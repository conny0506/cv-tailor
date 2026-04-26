import { escape, pick, pickArr, sectionLabels, RenderInput } from "./shared";

export function renderVisual({ cv, gen }: RenderInput): string {
  const lang = gen.language;
  const L = sectionLabels(lang);
  const p = cv.personal;

  const eduHtml = cv.education
    .map(
      (e) =>
        `<div class="row">
          <div>
            <div class="row-title">${escape(e.school)}</div>
            <div class="row-sub">${escape(pick(e.degree, lang))}</div>
          </div>
          <div class="row-date">${escape(e.start)} – ${escape(e.end)}</div>
        </div>`
    )
    .join("");

  const expHtml = cv.experience
    .map(
      (x) =>
        `<div class="entry">
          <div class="row">
            <div>
              <div class="row-title">${escape(pick(x.role, lang))}</div>
              <div class="row-sub">${escape(x.company)}</div>
            </div>
            <div class="row-date">${escape(x.start)} – ${escape(x.end)}</div>
          </div>
          <ul>${pickArr(x.bullets, lang).map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
        </div>`
    )
    .join("");

  const awardsHtml = cv.awards
    .map(
      (a) =>
        `<div class="entry">
          <div class="row">
            <div class="row-title">${escape(a.title)}</div>
            <div class="row-date">${escape(a.date)}</div>
          </div>
          <ul>${pickArr(a.bullets, lang).map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
        </div>`
    )
    .join("");

  const projectsHtml = gen.projects
    .map(
      (pr) =>
        `<div class="entry">
          <div class="row">
            <div class="row-title">${escape(pr.title)}</div>
            <div class="row-sub stack">${pr.stack.map(escape).join(" | ")}</div>
          </div>
          <ul>${pr.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
        </div>`
    )
    .join("");

  const skillsHtml = cv.skills
    .map(
      (s) =>
        `<div class="skill-row">
          <span class="skill-label">${escape(pick(s.label, lang))}:</span>
          <span class="skill-items">${s.items.map(escape).join(", ")}</span>
        </div>`
    )
    .join("");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${escape(p.name)}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 10.5pt; color: #1f2937; margin: 0; }
  .head {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: white;
    padding: 14pt 16pt;
    border-radius: 6pt;
    margin-bottom: 12pt;
  }
  .head h1 { margin: 0; font-size: 22pt; letter-spacing: 0.5px; }
  .head .title { font-size: 11pt; opacity: 0.9; margin-top: 3pt; }
  .head .contact { margin-top: 8pt; font-size: 9.5pt; line-height: 1.6; opacity: 0.95; }
  .head a { color: #cbd5e1; text-decoration: none; }
  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 2pt;
    margin: 12pt 0 6pt;
  }
  .row { display: flex; justify-content: space-between; gap: 12pt; }
  .row-title { font-weight: 600; color: #0f172a; }
  .row-sub { color: #475569; font-size: 10pt; }
  .row-date { font-size: 9.5pt; color: #64748b; white-space: nowrap; }
  .entry { margin-bottom: 8pt; }
  ul { margin: 4pt 0 0 16pt; padding: 0; }
  li { margin-bottom: 2pt; }
  .stack { font-style: italic; color: #1e3a8a; }
  .skill-row { margin-bottom: 3pt; }
  .skill-label { font-weight: 600; color: #0f172a; }
</style>
</head>
<body>
  <div class="head">
    <h1>${escape(p.name)}</h1>
    <div class="title">${escape(pick(p.title, lang))}</div>
    <div class="contact">
      ${escape(p.contact.email)} &nbsp;|&nbsp; ${escape(p.contact.phone)}<br/>
      ${escape(p.contact.linkedin)} &nbsp;|&nbsp; ${escape(p.contact.github)}
    </div>
  </div>

  <h2>${escape(L.summary)}</h2>
  <p>${escape(pick(cv.summary, lang))}</p>

  <h2>${escape(L.education)}</h2>${eduHtml}

  <h2>${escape(L.experience)}</h2>${expHtml}

  <h2>${escape(L.awards)}</h2>${awardsHtml}

  <h2>${escape(L.projects)}</h2>${projectsHtml}

  <h2>${escape(L.skills)}</h2>${skillsHtml}
</body>
</html>`;
}
