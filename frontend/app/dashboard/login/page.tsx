import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardLoginForm } from "@/components/dashboard/auth/DashboardLoginForm";

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

export default function DashboardLoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#28282a] px-4 py-10 font-dashSans text-white">
      <Suspense fallback={<LoginFallback />}>
        <DashboardLoginForm />
      </Suspense>
    </div>
  );
}
