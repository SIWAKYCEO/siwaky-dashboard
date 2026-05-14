import type { MetadataRoute } from "next";

import { locales } from "@/i18n";
import { SITE_URL } from "@/lib/seo/site";

const PATHS = [
  "",
  "/product",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/shipping",
  "/returns",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PATHS) {
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      const hreflang = loc === "ar" ? "ar-SA" : "en";
      languages[hreflang] = `${SITE_URL}/${loc}${path}`;
    }
    languages["x-default"] = `${SITE_URL}/ar${path}`;

    for (const loc of locales) {
      entries.push({
        url: `${SITE_URL}/${loc}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority:
          path === ""
            ? 1
            : path === "/product"
              ? 0.95
              : path.startsWith("/privacy") || path === "/terms" || path === "/shipping" || path === "/returns"
                ? 0.5
                : 0.8,
        alternates: { languages },
      });
    }
  }

  return entries;
}
