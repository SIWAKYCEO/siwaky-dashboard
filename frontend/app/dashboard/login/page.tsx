import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardLoginForm } from "@/components/dashboard/auth/DashboardLoginForm";
import { isDashboardAuthConfigured } from "@/lib/dashboard/auth/session";

export const metadata: Metadata = {
  title: "Sign in — SIWAKY Dashboard",
  robots: { index: false, follow: false },
};

function LoginFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-white/45">
      Loading…
    </div>
  );
}

export default async function DashboardLoginPage() {
  const dashboardAuthReady = isDashboardAuthConfigured();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#28282a] px-4 py-10 font-dashSans text-white">
      <Suspense fallback={<LoginFallback />}>
        <DashboardLoginForm authConfigured={dashboardAuthReady} />
      </Suspense>
    </div>
  );
}
