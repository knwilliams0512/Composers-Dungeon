/**
 * Renders `site/cover.png` from `site/cover.svg`.
 *
 * The page itself uses the SVG directly — 7KB and sharp at any pixel density,
 * where the PNG is 250KB and soft on a retina display. This raster exists for
 * one job only: og:image, because link-preview scrapers do not read SVG.
 *
 * Same approach as scripts/make-icons.mjs: draw the SVG onto a canvas sized to
 * the target, which respects the viewBox and so scales rather than crops.
 *
 *   node scripts/make-cover.mjs
 */
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";
import { encodePng } from "./lib/png.mjs";

const SRC = "site/cover.svg";
const W = 630;
const H = 500;
const svg = readFileSync(SRC, "utf8");

const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 400, height: 400 });
await page.setContent("<body style='margin:0'></body>");

async function rgba(width, height) {
  return page.evaluate(
    async (w, h, markup) => {
      const blob = new Blob([markup], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error("the SVG would not load"));
        img.src = url;
      });
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      // The art is transparent at its edges for the page's sake; a link
      // preview needs it flattened onto the page's own ground colour.
      ctx.fillStyle = "#0b0912";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      return Array.from(ctx.getImageData(0, 0, w, h).data);
    },
    width,
    height,
    svg
  );
}

// The art is opaque edge to edge, so the alpha channel is dead weight.
writeFileSync("site/cover.png", encodePng(W, H, await rgba(W, H), { alpha: false }));
console.log(`cover.png  ${W}x${H}`);

await browser.close();
