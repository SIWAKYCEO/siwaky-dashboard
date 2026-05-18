import type { MetadataRoute } from "next";

/** Internal dashboard — no public marketing URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
