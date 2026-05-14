import { Jimp } from "jimp";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "../public/images/flavors");

const THRESHOLD = 40; // pixels darker than this (0-255) on all channels = transparent

for (const file of readdirSync(dir).filter(f => f.endsWith(".png"))) {
  const src = join(dir, file);
  const img = await Jimp.read(src);

  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    if (r < THRESHOLD && g < THRESHOLD && b < THRESHOLD) {
      // Fully transparent
      this.bitmap.data[idx + 3] = 0;
    } else if (r < THRESHOLD * 2 && g < THRESHOLD * 2 && b < THRESHOLD * 2) {
      // Semi-transparent for anti-aliasing at edges
      const darkness = Math.max(r, g, b);
      const alpha = Math.round((darkness / (THRESHOLD * 2)) * 255);
      this.bitmap.data[idx + 3] = alpha;
    }
  });

  await img.write(src);
  console.log(`✓ ${file}`);
}

console.log("Done.");
