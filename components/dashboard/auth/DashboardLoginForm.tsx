"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

export function DashboardLoginForm({ authConfigured }: { authConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configError = searchParams.get("error") === "config";
  const middlewareError = searchParams.get("error") === "mw";
  const from = searchParams.get("from");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Sign-in failed");
        return;
      }
      setPassword("");
      const dest =
        from && from.startsWith("/dashboard") && !from.startsWith("/dashboard/login")
          ? from
          : "/dashboard";
      router.replace(dest);
      router.refresh();
    } catch {
      setFormError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8 px-5 py-16 sm:py-24">
      <div className="text-center">
        <p className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-white/52">
          SIWAKY · Team access
        </p>
        <h1 className="mt-4 font-dashDisplay text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          Sign in to dashboard
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-white/52">
          Orders and customer data are only available to signed-in operators.
        </p>
      </div>

      {configError || !authConfigured ? (
        <div
          className="rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100/95"
          role="alert"
        >
          Dashboard auth is not configured. Set{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[12px]">DASHBOARD_AUTH_SECRET</code>{" "}
          (32+ characters for JWT signing), then restart Next.js. Optional:{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[12px]">DASHBOARD_ADMIN_EMAIL</code>,{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[12px]">DASHBOARD_ADMIN_PASSWORD</code>.
        </div>
      ) : null}

      {middlewareError ? (
        <div
          className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-100/95"
          role="alert"
        >
          The dashboard gate hit an unexpected error. Stop duplicate{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[12px]">next dev</code> processes, delete{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[12px]">frontend/.next</code>, then restart — or sign in again below.
        </div>
      ) : null}

      {/* Native method=post prevents GET query-string leaks if JS fails before preventDefault */}
      <form
        method="post"
        action="/dashboard/login"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-[1.35rem] border border-white/[0.09] bg-black/40 p-7 shadow-glass backdrop-blur-xl"
      >
        <div className="space-y-2">
          <label htmlFor="dash-email" className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Email
          </label>
          <input
            id="dash-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/[0.12] bg-[#1a1a1d]/90 px-4 py-3 text-[15px] text-white outline-none ring-0 placeholder:text-white/35 focus:border-[#c9a962]/45"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="dash-password"
            className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45"
          >
            Password
          </label>
          <input
            id="dash-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/[0.12] bg-[#1a1a1d]/90 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[#c9a962]/45"
            placeholder="••••••••"
          />
        </div>

        {formError ? (
          <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-100/95" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-2xl border border-[#c9a962]/40 bg-gradient-to-br from-white/[0.12] via-black/45 to-black/55 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_14px_50px_-16px_rgba(0,0,0,.75)] backdrop-blur-md motion-safe:hover:border-[#c9a962]/55 disabled:opacity-45"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
