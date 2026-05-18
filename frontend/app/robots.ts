import type { MetadataRoute } from "next";

/** Block indexing for the orders dashboard deployment. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
