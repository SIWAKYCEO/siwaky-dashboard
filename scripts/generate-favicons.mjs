/**
 * Build favicons + apple-touch + PWA icon from public/logo.png.
 * Uses brand background #28282A so the white / gold mark stays legible at small sizes.
 * Extra padding on tiny sizes keeps the mark centered and readable in browser tabs.
 *
 * Run from repo: cd frontend && npm run generate:favicons
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { Jimp } from "jimp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const LOGO = join(PUBLIC, "logo.png");
const STATIC_ICONS = join(PUBLIC, "static", "icons");

/** Background under transparent areas / canvas fill — pure black to match the SIWAKY mark (white on black). */
const BG = 0xff000000;

/** Padding as fraction of icon edge — larger for small pixels so the mark stays clear */
function paddingForSize(size) {
  if (size <= 32) return 0.14;
  if (size <= 48) return 0.12;
  if (size <= 180) return 0.1;
  return 0.08;
}

async function renderIcon(size, outFile) {
  const logo = await Jimp.read(LOGO);
  const canvas = new Jimp({ width: size, height: size, color: BG });
  const padFrac = paddingForSize(size);
  const pad = Math.max(1, Math.floor(size * padFrac));
  const inner = size - pad * 2;
  const lw = logo.width;
  const lh = logo.height;
  const scale = Math.min(inner / lw, inner / lh);
  const nw = Math.max(1, Math.round(lw * scale));
  const nh = Math.max(1, Math.round(lh * scale));
  logo.resize({ w: nw, h: nh });
  const x = Math.floor((size - nw) / 2);
  const y = Math.floor((size - nh) / 2);
  canvas.composite(logo, x, y);
  await canvas.write(outFile);
}

async function main() {
  await mkdir(STATIC_ICONS, { recursive: true });

  await renderIcon(16, join(STATIC_ICONS, "favicon-16x16.png"));
  await renderIcon(32, join(STATIC_ICONS, "favicon-32x32.png"));
  await renderIcon(48, join(STATIC_ICONS, "favicon-48x48.png"));

  await renderIcon(180, join(PUBLIC, "apple-touch-icon.png"));
  await renderIcon(512, join(STATIC_ICONS, "icon-512.png"));

  const icoBuf = await pngToIco([
    await readFile(join(STATIC_ICONS, "favicon-16x16.png")),
    await readFile(join(STATIC_ICONS, "favicon-32x32.png")),
    await readFile(join(STATIC_ICONS, "favicon-48x48.png")),
  ]);
  await writeFile(join(PUBLIC, "favicon.ico"), icoBuf);

  console.log("OK: favicon.ico, apple-touch-icon.png, static/icons/*");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
