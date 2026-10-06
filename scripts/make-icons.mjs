/**
 * Regenerates every app icon from `public/icons/icon.svg`.
 *
 * The previous exports were cropped rather than scaled: each small size held a
 * magnified corner of the artwork instead of the whole mark, which is why the
 * browser and the taskbar fell back to their own default icon. Drawing the SVG
 * onto a canvas sized to the target respects the viewBox, so every size is the
 * complete logo.
 *
 *   node scripts/make-icons.mjs
 */
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodePng } from "./lib/png.mjs";

const ICONS = "public/icons";
const svg = readFileSync(join(ICONS, "icon.svg"), "utf8");

/** Plain square icons, and the sizes the manifest and <head> ask for. */
const PNG_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512];

const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 600, height: 600 });
await page.setContent("<body style='margin:0'></body>");

/** Raw RGBA of the whole SVG scaled to `size`, optionally inset for maskable. */
async function rgba(size, insetRatio = 0) {
  return page.evaluate(
    async (s, markup, inset) => {
      const blob = new Blob([markup], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const c = document.createElement("canvas");
      c.width = s;
      c.height = s;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, s, s);
      // Draw the entire image into the whole square: this scales, never crops.
      const pad = Math.round(s * inset);
      ctx.drawImage(img, pad, pad, s - pad * 2, s - pad * 2);
      URL.revokeObjectURL(url);
      return Array.from(ctx.getImageData(0, 0, s, s).data);
    },
    size,
    svg,
    insetRatio
  );
}

for (const size of PNG_SIZES) {
  const bytes = await rgba(size);
  writeFileSync(join(ICONS, `icon-${size}.png`), encodePng(size, size, bytes));
  console.log(`icon-${size}.png`);
}

// A maskable icon must survive being cropped to a circle, so the mark is inset.
writeFileSync(join(ICONS, "maskable-512.png"), encodePng(512, 512, await rgba(512, 0.1)));
console.log("maskable-512.png");

await browser.close();
