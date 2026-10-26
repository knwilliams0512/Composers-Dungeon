/**
 * Checks that printing a score gives sheets of music rather than a screenshot
 * of the editor.
 *
 *   node scripts/check-print.mjs
 *
 * The risk in print CSS is not the declarations, it is the selectors. The
 * rules hide chrome by marking the two containers on the path to the score and
 * hiding everything beside them with :not(), which is compact and easy to get
 * subtly wrong — and impossible to check by reading, because what matters is
 * what a browser computes.
 *
 * So this builds the editor's DOM shape, loads the real globals.css into it,
 * emulates print media in Chromium and asks the browser what is visible and
 * how big a page box is. It does not boot the app: the app needs an account
 * and a saved score, and none of that exercises a single selector.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const problems = [];
const fail = (m) => problems.push(m);

const css = readFileSync("src/app/globals.css", "utf8");

// Fail early and loudly if the block this file exists to test is not there.
if (!/@media print/.test(css)) {
  console.log("print: no @media print block in src/app/globals.css");
  console.log("FAIL - 1 problems:\n  - the print stylesheet is missing entirely");
  process.exit(1);
}

/**
 * The editor's shape, as StudioEditor renders it: a fixed-height shell holding
 * a top bar, a row of [left panel, the score, right panel], and a bottom
 * panel. The score itself sits inside <main> as the pages container.
 *
 * The page size is injected the way ScoreCanvas injects it, so the custom
 * properties the print rules read are present.
 */
const PAGE_W = 210;
const PAGE_H = 297;
const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>${css}</style>
<style media="print">
  @page { size: ${PAGE_W}mm ${PAGE_H}mm; margin: 0; }
  :root { --cd-page-w: ${PAGE_W}mm; --cd-page-h: ${PAGE_H}mm; }
</style></head>
<body>
  <div id="shell" class="cd-print-shell" style="display:flex;flex-direction:column;height:100vh;overflow:hidden">
    <div id="topbar">top bar</div>
    <div id="toolbar">notation toolbar</div>
    <div id="row" class="cd-print-keep" style="display:flex;flex:1;min-height:0;position:relative">
      <aside id="left">instruments</aside>
      <main id="main" class="cd-print-keep" style="flex:1;min-width:0;overflow:auto;position:relative">
        <div id="floating">floating tools</div>
        <div id="pages" class="cd-print-root" style="display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0">
          <div class="cd-print-page" id="p1" style="width:600px;height:850px;box-shadow:0 0 10px #000">page one</div>
          <div class="cd-print-page" id="p2" style="width:600px;height:850px;box-shadow:0 0 10px #000">page two</div>
        </div>
      </main>
      <aside id="right">inspector</aside>
    </div>
    <div id="keyboard">piano keyboard</div>
  </div>
</body></html>`;

/**
 * Find a browser rather than naming one.
 *
 * This used to hard-code /opt/pw-browsers/chromium-1194/chrome-linux/chrome,
 * which is a specific Playwright build number — so the day the container's
 * Chromium moved to 1243 in a directory called chrome-linux64 instead, the
 * check stopped running at all. A pinned path to something somebody else
 * installs is a check that breaks for a reason unrelated to the thing it
 * tests.
 *
 * CHROME_PATH still wins if it is set.
 */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (existsSync(root)) {
    // Newest build first, so a container holding two does not pick the old one.
    const dirs = readdirSync(root)
      .filter((d) => d.startsWith("chromium"))
      .sort()
      .reverse();
    for (const dir of dirs) {
      for (const layout of ["chrome-linux64/chrome", "chrome-linux/chrome", "chrome-linux/headless_shell"]) {
        const candidate = join(root, dir, layout);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (existsSync(p)) return p;
  }
  return null;
}

const chrome = findChrome();
if (!chrome) {
  console.log(
    "FAIL - no Chromium found. Set CHROME_PATH, or install one where " +
      "PLAYWRIGHT_BROWSERS_PATH points."
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMediaType("print");

  const seen = await page.evaluate(() => {
    const read = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { display: cs.display, width: r.width, height: r.height };
    };
    return {
      topbar: read("topbar"),
      toolbar: read("toolbar"),
      left: read("left"),
      right: read("right"),
      floating: read("floating"),
      keyboard: read("keyboard"),
      pages: read("pages"),
      p1: read("p1"),
      p2: read("p2"),
      main: read("main"),
      shell: read("shell"),
      // One millimetre in CSS pixels, so the assertions can be written in mm.
      mm: (() => {
        const probe = document.createElement("div");
        probe.style.width = "100mm";
        document.body.appendChild(probe);
        const w = probe.getBoundingClientRect().width / 100;
        probe.remove();
        return w;
      })(),
    };
  });

  // --- The editor must be gone -----------------------------------------
  for (const [name, id] of [
    ["the top bar", "topbar"],
    ["the notation toolbar", "toolbar"],
    ["the instruments panel", "left"],
    ["the inspector", "right"],
    ["the floating tools", "floating"],
    ["the on-screen keyboard", "keyboard"],
  ]) {
    const el = seen[id];
    if (!el) fail(`${name} was not in the test document at all`);
    else if (el.display !== "none") fail(`${name} still prints (display: ${el.display})`);
  }

  // --- The score must be there ------------------------------------------
  if (!seen.pages || seen.pages.display === "none") fail("the pages container does not print");
  for (const id of ["p1", "p2"]) {
    const el = seen[id];
    if (!el) fail(`page ${id} was not in the test document`);
    else if (el.display === "none") fail(`page ${id} does not print`);
  }

  // --- A page must be the real paper size, not the on-screen pixel size --
  const mm = seen.mm;
  const wantW = PAGE_W * mm;
  const wantH = PAGE_H * mm;
  for (const id of ["p1", "p2"]) {
    const el = seen[id];
    if (!el || el.display === "none") continue;
    // Within a pixel: millimetre-to-pixel is fractional.
    if (Math.abs(el.width - wantW) > 1.5)
      fail(
        `page ${id} prints ${(el.width / mm).toFixed(1)}mm wide, expected ${PAGE_W}mm ` +
          `(the on-screen zoom size is leaking into print)`
      );
    if (Math.abs(el.height - wantH) > 1.5)
      fail(`page ${id} prints ${(el.height / mm).toFixed(1)}mm tall, expected ${PAGE_H}mm`);
  }

  // --- The shell must not clip the pages --------------------------------
  const shellOverflow = await page.evaluate(() => {
    const el = document.getElementById("main");
    return el ? getComputedStyle(el).overflow : null;
  });
  if (shellOverflow && shellOverflow !== "visible")
    fail(`<main> still has overflow: ${shellOverflow} when printing, which clips every page after the first`);

  // Two full pages plus the shell means the document is taller than one sheet;
  // if the shell were still 100vh the pages would be cut off.
  if (seen.shell && seen.p1 && seen.shell.height < seen.p1.height * 1.5)
    fail(
      `the shell is ${seen.shell.height.toFixed(0)}px tall for two ${seen.p1.height.toFixed(0)}px pages, ` +
        `so its fixed height is still in force and the second page is clipped`
    );

  // --- A page break between sheets, and none trailing -------------------
  const breaks = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll(".cd-print-page"));
    return els.map((el) => {
      const cs = getComputedStyle(el);
      return cs.breakAfter || cs.pageBreakAfter;
    });
  });
  if (breaks.length >= 2) {
    if (!/page|always/.test(breaks[0]))
      fail(`the first page has break-after "${breaks[0]}", so two pages would print on one sheet`);
    if (/page|always/.test(breaks[breaks.length - 1]))
      fail("the last page forces a break after it, which prints a trailing blank sheet");
  }
} finally {
  await browser.close().catch(() => {});
}

console.log(
  "print: editor chrome, page size, clipping and page breaks checked in Chromium with print media"
);
if (problems.length === 0) console.log("OK - a score prints as sheets of music");
else {
  console.log(`FAIL - ${problems.length} problems:`);
  problems.forEach((p) => console.log("  -", p));
}
process.exit(problems.length ? 1 : 0);
