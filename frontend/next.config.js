/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => Date.now().toString(),

  async headers() {
    const noStoreDocument = [
      { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
      { key: "Pragma", value: "no-cache" },
      { key: "CDN-Cache-Control", value: "no-store" },
    ];

    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { source: "/", headers: noStoreDocument },
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
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.siwaky.com",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://siwaky.com",
    NEXT_PUBLIC_CHECKOUT_POST_URL: process.env.NEXT_PUBLIC_CHECKOUT_POST_URL || "",
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

module.exports = nextConfig;
