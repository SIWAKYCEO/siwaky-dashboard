import "./globals.css";

import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Noto_Naskh_Arabic,
  Scheherazade_New,
} from "next/font/google";

const scheherazade = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-scheherazade",
  display: "swap",
  preload: true,
});

const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://siwaky.com"),
  applicationName: "SIWAKY",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/static/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/static/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#28282A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${scheherazade.variable} ${naskh.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
