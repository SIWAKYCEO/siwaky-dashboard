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
    return [
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/:locale(ar|en)/product",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
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
