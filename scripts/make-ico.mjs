/**
 * Builds a real multi-size .ico from the app's icon SVG.
 *
 * A PNG renamed to .ico satisfies browsers but not Windows: Explorer, the
 * taskbar and the NSIS compiler all want a genuine ICO container, and NSIS
 * aborts outright when handed anything else. There is no image library in
 * this project, so the pixels come from Chromium (already present for tests)
 * and the container is written here, byte by byte.
 *
 *   node scripts/make-ico.mjs <input.svg> <output.ico> [sizes]
 */
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

const [, , svgPath, outPath, sizeArg] = process.argv;
if (!svgPath || !outPath) {
  console.error("usage: node scripts/make-ico.mjs <input.svg> <output.ico> [16,32,48,256]");
  process.exit(1);
}
const sizes = (sizeArg ?? "16,24,32,48,64,128,256").split(",").map(Number);

const svg = readFileSync(svgPath, "utf8");
const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setContent(`<body style="margin:0">${svg}</body>`);

/** Raw RGBA for the icon drawn at one size. */
async function rgbaAt(size) {
  return page.evaluate(async (s, markup) => {
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
    ctx.drawImage(img, 0, 0, s, s);
    URL.revokeObjectURL(url);
    return Array.from(ctx.getImageData(0, 0, s, s).data);
  }, size, svg);
}

const images = [];
for (const size of sizes) {
  const rgba = Buffer.from(await rgbaAt(size));

  // A DIB inside an ICO stores the colour mask and the AND mask together, so
  // the header claims twice the real height.
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12); // planes
  header.writeUInt16LE(32, 14); // bits per pixel
  header.writeUInt32LE(0, 16); // BI_RGB

  // Pixels are bottom-up and byte order is BGRA.
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const from = (y * size + x) * 4;
      const to = ((size - 1 - y) * size + x) * 4;
      pixels[to] = rgba[from + 2];
      pixels[to + 1] = rgba[from + 1];
      pixels[to + 2] = rgba[from];
      pixels[to + 3] = rgba[from + 3];
    }
  }

  // The AND mask is unused for 32-bit icons but must still be present, with
  // each row padded to a four-byte boundary.
  const maskRow = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskRow * size, 0);

  images.push({ size, data: Buffer.concat([header, pixels, mask]) });
}
await browser.close();

const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0);
dir.writeUInt16LE(1, 2); // 1 = icon
dir.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const entries = images.map((img) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // 0 means 256
  e.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
  e.writeUInt8(0, 2); // palette colours
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(img.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.data.length;
  return e;
});

writeFileSync(outPath, Buffer.concat([dir, ...entries, ...images.map((i) => i.data)]));
console.log(`wrote ${outPath}: ${images.length} sizes (${sizes.join(", ")})`);
