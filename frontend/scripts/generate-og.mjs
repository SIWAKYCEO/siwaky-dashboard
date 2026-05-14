/**
 * Creates public/og.jpg (1200×630) for Open Graph sharing.
 * Uses brand background #28282A and scales logo.png when present.
 *
 * Run: cd frontend && npm run generate:og
 */

import { access, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { Jimp, JimpMime } from "jimp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const LOGO = join(PUBLIC, "logo.png");
const OUT = join(PUBLIC, "og.jpg");

async function main() {
  const W = 1200;
  const H = 630;
  const canvas = new Jimp({ width: W, height: H, color: "#28282A" });

  try {
    await access(LOGO);
    const logo = await Jimp.read(LOGO);
    const maxW = Math.floor(W * 0.42);
    const maxH = Math.floor(H * 0.55);
    const lw = logo.width;
    const lh = logo.height;
    const scale = Math.min(maxW / lw, maxH / lh);
    const nw = Math.max(1, Math.round(lw * scale));
    const nh = Math.max(1, Math.round(lh * scale));
    logo.resize({ w: nw, h: nh });
    const x = Math.round((W - nw) / 2);
    const y = Math.round((H - nh) / 2 - 20);
    canvas.composite(logo, x, y);
  } catch {
    // No logo — solid brand plate only
  }

  const buf = await canvas.getBuffer(JimpMime.jpeg);
  await writeFile(OUT, buf);
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
