/**
 * Minimal PNG encoder.
 *
 * Lifted out of scripts/make-icons.mjs when the download page's cover art
 * needed the same thing at a non-square size, so there is one encoder rather
 * than two that drift apart.
 *
 * It picks a filter per scanline rather than writing raw rows. That costs a
 * few lines and buys a lot: the cover art is a wash of smooth gradients, which
 * is the worst case for unfiltered rows and the best case for filtered ones —
 * it took the 2x export from 884KB to a fraction of that. Dropping the alpha
 * channel on an image with no transparency saves a further quarter.
 */
import { deflateSync } from "node:zlib";

/**
 * @param rgbaBytes row-major RGBA, `width * height * 4` bytes.
 * @param alpha     false writes an opaque RGB image and discards the channel.
 */
export function encodePng(width, height, rgbaBytes, { alpha = true } = {}) {
  const bpp = alpha ? 4 : 3;
  const stride = width * bpp;

  // Drop alpha up front if it is not wanted, so the filters below see the
  // same layout they will write.
  let px;
  if (alpha) {
    px = Buffer.from(rgbaBytes);
  } else {
    px = Buffer.alloc(stride * height);
    for (let i = 0, o = 0; i < width * height; i++, o += 3) {
      px[o] = rgbaBytes[i * 4];
      px[o + 1] = rgbaBytes[i * 4 + 1];
      px[o + 2] = rgbaBytes[i * 4 + 2];
    }
  }

  const raw = Buffer.alloc((stride + 1) * height);
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);
  const cand = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    px.copy(line, 0, y * stride, (y + 1) * stride);

    // The standard heuristic: try each filter, keep the one whose output has
    // the smallest sum of absolute signed differences, which is the best cheap
    // proxy for what deflate will manage with it.
    let bestType = 0;
    let bestScore = Infinity;
    let best = null;
    for (let type = 0; type <= 4; type++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? line[x - bpp] : 0;
        const b = prev[x];
        const c = x >= bpp ? prev[x - bpp] : 0;
        let v;
        switch (type) {
          case 0: v = line[x]; break;
          case 1: v = line[x] - a; break;
          case 2: v = line[x] - b; break;
          case 3: v = line[x] - ((a + b) >> 1); break;
          default: v = line[x] - paeth(a, b, c);
        }
        cand[x] = v & 0xff;
        score += cand[x] < 128 ? cand[x] : 256 - cand[x];
      }
      if (score < bestScore) {
        bestScore = score;
        bestType = type;
        best = Buffer.from(cand);
      }
    }

    raw[y * (stride + 1)] = bestType;
    best.copy(raw, y * (stride + 1) + 1);
    line.copy(prev);
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
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = alpha ? 6 : 2; // colour type: RGBA or RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
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
