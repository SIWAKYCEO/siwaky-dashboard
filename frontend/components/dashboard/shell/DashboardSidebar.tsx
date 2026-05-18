"use client";

import { Shield } from "lucide-react";

import type { DashboardNavEntry } from "./dashboardNav";
import { dashboardNavEntries } from "./dashboardNav";

type RailProps = {
  onNavigate: (id: string) => void;
};

function NavTiles({
  items,
  onNavigate,
}: {
  items: DashboardNavEntry[];
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-1.5 px-3 pb-4 pt-8" aria-label="Dashboard workspace">
      {items.map((item) => {
        const Icon = item.Icon;
        return (
          <button
            key={item.id}
            type="button"
            data-section={item.id}
            onClick={() => onNavigate(item.id)}
            className="group flex w-full gap-4 rounded-[1.15rem] border border-transparent bg-transparent px-3.5 py-3 text-left outline-none motion-safe:transition-all motion-safe:duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/42 text-[#ebe2c9] shadow-inner motion-safe:group-hover:shadow-[0_0_26px_-8px_rgba(201,169,98,.42)] motion-safe:group-hover:border-[#c9a962]/35">
              <Icon className="size-[19px]" strokeWidth={1.65} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="font-dashSans text-[15px] font-semibold tracking-tight text-white/95">
                {item.label}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.26em] text-white/43">
                {item.subtitle}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardSidebarRail({ onNavigate }: RailProps) {
  return (
    <div className="flex h-[100dvh] w-[272px] shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#29292c]/90 via-[#28282a] to-[#1e1e21]/95 backdrop-blur-3xl md:w-[296px]">
      <BrandHeader />

      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        <NavTiles items={dashboardNavEntries} onNavigate={onNavigate} />

        <div className="mx-5 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#323236]/92 to-transparent p-[1px] shadow-glass">
          <div className="rounded-[calc(1.5rem-1px)] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/45 text-emerald-200/90 shadow-inner">
                <Shield className="size-5" aria-hidden strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-dashSans text-[12px] font-semibold uppercase tracking-[0.22em] text-white/62">
                  Private workspace
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-siwaky-muted">
                  Built for SIWAKY operators only — upcoming team login will gate alerts, sounds, and live feeds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DrawerProps = {
  onNavigate: (id: string) => void;
  onClose: () => void;
};

export function DashboardSidebarDrawer({ onClose, onNavigate }: DrawerProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#29292c]/95 via-[#28282a]/98 to-[#1f1f22] backdrop-blur-3xl">
      <div className="flex justify-end px-5 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-white/[0.1] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70 hover:bg-white/[0.05]"
          aria-label="Close navigation drawer"
        >
          Close panel
        </button>
      </div>
      <BrandHeader compact />

      <div className="min-h-0 flex-1 overflow-y-auto pb-20">
        <NavTiles items={dashboardNavEntries} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative z-10 overflow-visible border-b border-white/[0.065] px-6 ${compact ? "py-5" : "py-9"}`}
    >
      <div className="relative flex flex-col gap-3 overflow-visible">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG wordmark */}
        <img
          src="/images/logo-siwaky.svg"
          alt="SIWAKY"
          width={compact ? 120 : 150}
          height={compact ? 30 : 40}
          decoding="async"
          className={`w-auto shrink-0 object-contain ${compact ? "h-9 max-w-[148px]" : "h-11 max-w-[188px]"}`}
        />
        <span
          aria-live="polite"
          className="relative z-[1] inline-flex w-fit max-w-full items-center gap-1.5 overflow-visible rounded-full border border-emerald-400/[0.2] bg-emerald-500/[0.11] px-2.5 py-1.5 font-dashSans text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-emerald-400/[0.08]"
        >
          <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-visible">
            <span className="pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/82 opacity-80 motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="relative m-auto size-[5px] rounded-full bg-emerald-100 shadow-[0_0_12px_-1px_rgba(167,243,208,0.92)] ring-[2px] ring-emerald-400/35" />
          </span>
          Live ledger
        </span>
      </div>
      <p className="mt-4 max-w-[16rem] text-[13px] leading-relaxed text-siwaky-muted">
        {compact
          ? "Navigate workspaces"
          : "Luxury-grade operations rail · SIWAKY internal"}
      </p>
    </div>
  );
}
