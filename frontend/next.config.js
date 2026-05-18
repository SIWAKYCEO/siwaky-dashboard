const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Unique `_next/static` chunk URLs on every build — avoids stale hashed assets after deploy. */
  generateBuildId: async () => Date.now().toString(),
  async redirects() {
    const d = "/ar";
    return [
      {
        source: "/product",
        destination: `${d}/product`,
        permanent: true,
      },
      {
        source: "/about",
        destination: `${d}/about`,
        permanent: true,
      },
      {
        source: "/contact",
        destination: `${d}/contact`,
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: `${d}/privacy-policy`,
        permanent: true,
      },
      {
        source: "/terms",
        destination: `${d}/terms`,
        permanent: true,
      },
      {
        source: "/shipping",
        destination: `${d}/shipping`,
        permanent: true,
      },
      {
        source: "/returns",
        destination: `${d}/returns`,
        permanent: true,
      },
      {
        source: "/thank-you",
        destination: `${d}/thank-you`,
        permanent: true,
      },
    ];
  },
  async headers() {
    /** HTML / negotiated responses must revalidate immediately after deploy — never CDN-stale shells. */
    const noStoreDocument = [
      { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
      { key: "Pragma", value: "no-cache" },
      { key: "CDN-Cache-Control", value: "no-store" },
    ];

    return [
      // Hashed build output — safe to cache aggressively (different filename each deploy thanks to generateBuildId).
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      { source: "/", headers: noStoreDocument },
      { source: "/ar/:path*", headers: noStoreDocument },
      { source: "/en/:path*", headers: noStoreDocument },
      { source: "/dashboard/:path*", headers: noStoreDocument },
      {
        source: "/api/dashboard/:path*",
        headers: noStoreDocument,
      },
    ];
  },
  output: "standalone",
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn", "log"] }
        : false,
  },
  // Never put `DASHBOARD_AUTH_SECRET` / `DASHBOARD_ADMIN_*` in `env` — Next bundles `env.*` into
  // CLIENT JavaScript (`process.env[NEXT_PUBLIC_*]` pattern + explicit keys), which would leak secrets.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.siwaky.com",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://siwaky.com",
    /**
     * Optional absolute POST URL for checkout (split hosts / CDN). Example:
     * `https://siwaky.com/api/orders`. Path `/api/orders` appended if omitted.
     */
    NEXT_PUBLIC_CHECKOUT_POST_URL: process.env.NEXT_PUBLIC_CHECKOUT_POST_URL || "",
    /** Bump via env or increment default after replacing `public/logo.png` to bust CDN / `/_next/image` cache */
    NEXT_PUBLIC_LOGO_REVISION: process.env.NEXT_PUBLIC_LOGO_REVISION || "6",
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "siwaky.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

module.exports = withNextIntl(nextConfig);
