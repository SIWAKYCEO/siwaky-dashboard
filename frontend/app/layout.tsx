import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.DASHBOARD_PUBLIC_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://dashboard.siwaky.com",
  ),
  title: "SIWAKY — Dashboard",
  applicationName: "SIWAKY Dashboard",
  robots: { index: false, follow: false },
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
  themeColor: "#28282a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
