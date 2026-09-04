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
import { deflateSync } from "node:zlib";

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

/** Minimal PNG encoder: one IDAT of raw filtered scanlines, deflate-stored. */
function encodePng(size, rgbaBytes) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size * 4; x++) {
      raw[y * (size * 4 + 1) + 1 + x] = rgbaBytes[y * size * 4 + x];
    }
  }
  const idat = deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

for (const size of PNG_SIZES) {
  const bytes = await rgba(size);
  writeFileSync(join(ICONS, `icon-${size}.png`), encodePng(size, bytes));
  console.log(`icon-${size}.png`);
}

// A maskable icon must survive being cropped to a circle, so the mark is inset.
writeFileSync(join(ICONS, "maskable-512.png"), encodePng(512, await rgba(512, 0.1)));
console.log("maskable-512.png");

await browser.close();
