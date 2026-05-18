#!/usr/bin/env node
/**
 * Retry downloading Shopify’s loud cash-register MP3 into `public/sounds/kaching.mp3`.
 * The public CDN URL sometimes returns 404; run after Shopify updates links.
 *
 *   node scripts/fetch-shopify-kaching.mjs
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "sounds", "kaching.mp3");
const urls = [
  "https://cdn.shopify.com/s/files/1/0533/2089/files/loud-chaching.mp3",
];

function download(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const loc = res.headers.location;
        res.resume();
        if (!loc) return reject(new Error("redirect without location"));
        return resolve(download(new URL(loc, url).href));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`${res.statusCode}`));
      }
      mkdir(dirname(out), { recursive: true }).then(() => {
        const file = createWriteStream(out);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      }, reject);
    }).on("error", reject);
  });
}

for (const u of urls) {
  try {
    await download(u);
    console.log("OK", u, "->", out);
    process.exit(0);
  } catch (e) {
    console.warn("skip", u, e?.message ?? e);
  }
}
console.error("All URLs failed — place kaching.mp3 manually under public/sounds/");
process.exit(1);
