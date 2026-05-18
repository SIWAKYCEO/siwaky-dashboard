import type { Metadata, Viewport } from "next";

import type { ReactNode } from "react";

import { Cormorant_Garamond, DM_Sans } from "next/font/google";



import { DashboardHtmlLock } from "@/components/dashboard/DashboardHtmlLock";

import { DashboardAlertsProvider } from "@/components/dashboard/providers/DashboardAlertsProvider";



const dmSans = DM_Sans({

  subsets: ["latin"],

  variable: "--font-sans",

  display: "swap",

});



const cormorant = Cormorant_Garamond({

  subsets: ["latin"],

  weight: ["500", "600", "700"],

  variable: "--font-display",

  display: "swap",

});



export const metadata: Metadata = {

  title: "SIWAKY — Orders dashboard",

  description: "Internal orders dashboard for SIWAKY.",

  robots: "noindex, nofollow",

  manifest: "/manifest-dashboard.webmanifest",

  appleWebApp: {

    capable: true,

    title: "SIWAKY Dashboard",

  },

};



export const viewport: Viewport = {

  themeColor: "#28282a",

  width: "device-width",

  initialScale: 1,

  maximumScale: 1,

};



export default function DashboardLayout({ children }: { children: ReactNode }) {

  return (

    <div

      lang="en"

      dir="ltr"

      className={`dashboard-shell-root ${dmSans.variable} ${cormorant.variable}`}

      suppressHydrationWarning

    >

      <DashboardHtmlLock />

      <DashboardAlertsProvider>

        {/* Solid canvas only — gradients live in DashboardShell to avoid stacked washes */}

        <div className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-[#28282a] font-dashSans text-white antialiased">

          <div className="min-h-dvh min-w-0 w-full overflow-x-hidden">{children}</div>

        </div>

      </DashboardAlertsProvider>

    </div>

  );

}

