import { escape, pick, pickArr, sectionLabels, RenderInput } from "./shared";

export function renderAts({ cv, gen }: RenderInput): string {
  const lang = gen.language;
  const L = sectionLabels(lang);
  const p = cv.personal;

  const contactLine = [
    p.contact.email,
    p.contact.phone,
    p.contact.linkedin.replace(/^https?:\/\//, ""),
    p.contact.github.replace(/^https?:\/\//, ""),
  ]
    .map(escape)
    .join(" &middot; ");

  const eduHtml = cv.education
    .map(
      (e) => `
    <div class="row">
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
      (x) => `
    <div class="entry">
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
      (a) => `
    <div class="entry">
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
      (pr) => `
    <div class="entry">
      <div class="row">
        <div class="row-title">${escape(pr.title)}</div>
        <div class="row-sub stack">${pr.stack.map(escape).join(" &middot; ")}</div>
      </div>
      <ul>${pr.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
    </div>`
    )
    .join("");

  const skillsHtml = cv.skills
    .map(
      (s) => `
    <div class="skill-row">
      <span class="skill-label">${escape(pick(s.label, lang))}:</span>
      <span class="skill-items">${s.items.map(escape).join(", ")}</span>
    </div>`
    )
    .join("");

  const langsHtml = cv.languages
    .map(
      (l) =>
        `<li>${escape(pick(l.name, lang))}: ${escape(pick(l.level, lang))}</li>`
    )
    .join("");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${escape(p.name)} — ${escape(pick(p.title, lang))}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body {
    font-family: 'Inter', 'Source Sans Pro', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.4;
    color: #1a1a1a;
  }
  header { margin-bottom: 8pt; }
  h1 { font-size: 22pt; margin: 0; letter-spacing: 0.5px; }
  .title { font-size: 11pt; color: #444; margin-top: 2pt; }
  .contact { font-size: 9pt; color: #555; margin-top: 4pt; }
  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #111;
    border-bottom: 1px solid #888;
    padding-bottom: 2pt;
    margin: 12pt 0 6pt;
  }
  .summary { text-align: justify; }
  .row { display: flex; justify-content: space-between; gap: 12pt; }
  .row-title { font-weight: 600; }
  .row-sub { color: #444; font-size: 10pt; }
  .row-date { font-size: 9.5pt; color: #555; white-space: nowrap; }
  .entry { margin-bottom: 8pt; }
  ul { margin: 4pt 0 0 16pt; padding: 0; }
  li { margin-bottom: 2pt; }
  .stack { font-style: italic; }
  .skill-row { margin-bottom: 3pt; }
  .skill-label { font-weight: 600; }
</style>
</head>
<body>
  <header>
    <h1>${escape(p.name)}</h1>
    <div class="title">${escape(pick(p.title, lang))}</div>
    <div class="contact">${contactLine}</div>
  </header>

  <h2>${escape(L.summary)}</h2>
  <p class="summary">${escape(pick(cv.summary, lang))}</p>

  <h2>${escape(L.education)}</h2>
  ${eduHtml}

  <h2>${escape(L.experience)}</h2>
  ${expHtml}

  <h2>${escape(L.awards)}</h2>
  ${awardsHtml}

  <h2>${escape(L.projects)}</h2>
  ${projectsHtml}

  <h2>${escape(L.skills)}</h2>
  ${skillsHtml}

  <h2>${escape(L.languages)}</h2>
  <ul>${langsHtml}</ul>
</body>
</html>`;
}
