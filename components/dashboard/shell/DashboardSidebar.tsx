"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type { DashboardNavEntry } from "./dashboardNav";
import { dashboardNavEntries } from "./dashboardNav";

// ── Shared nav tile list ──────────────────────────────────────────────────────

function NavTiles({
  items,
  onNavigate,
  activeId,
  compact,
}: {
  items: DashboardNavEntry[];
  onNavigate: (id: string) => void;
  activeId?: string | null;
  compact?: boolean;
}) {
  return (
    <nav
      className={"flex flex-col " + (compact ? "gap-0.5 px-2 pb-3 pt-5" : "gap-1.5 px-3 pb-4 pt-8")}
      aria-label="Dashboard workspace"
    >
      {items.map((item) => {
        const Icon = item.Icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-section={item.id}
            onClick={() => onNavigate(item.id)}
            style={{ borderLeft: isActive ? "3px solid #C9A84C" : "3px solid transparent" }}
            className={"group flex w-full items-center gap-3.5 rounded-xl bg-transparent px-3 text-left outline-none transition-colors hover:bg-white/[0.04] " + (compact ? "py-3" : "py-3.5") + " " + (isActive ? "bg-white/[0.03]" : "")}
          >
            <span
              className={"flex shrink-0 items-center justify-center rounded-xl border border-white/[0.08] shadow-inner " + (isActive ? "border-[#c9a84c]/35 bg-[#1c2010] text-[#c9a84c]" : "bg-[#1a1a1d] text-[#c9a84c] group-hover:border-[#c9a84c]/28") + " " + (compact ? "size-[42px]" : "size-10")}
            >
              <Icon className={compact ? "size-5" : "size-[18px]"} strokeWidth={1.65} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className={"block font-bold leading-tight text-white/95 " + (compact ? "text-[15px]" : "text-[14px]")}>
                {item.label}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">
                {item.subtitle}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Desktop rail ──────────────────────────────────────────────────────────────

type RailProps = { onNavigate: (id: string) => void };

export function DashboardSidebarRail({ onNavigate }: RailProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    const entry = dashboardNavEntries.find((e) => e.id === id);
    if (entry?.href) {
      router.push(entry.href);
      return;
    }
    // If we're not on the main dashboard, navigate there first
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
      return;
    }
    setActiveId(id);
    onNavigate(id);
  };

  return (
    <div className="flex h-[100dvh] w-[272px] shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#29292c]/90 via-[#28282a] to-[#1e1e21]/95 backdrop-blur-3xl md:w-[296px]">
      <RailBrandHeader />

      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        <NavTiles items={dashboardNavEntries} onNavigate={handleNavigate} activeId={activeId} compact />

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
                  Built for SIWAKY operators only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailBrandHeader() {
  return (
    <div className="relative z-10 overflow-visible border-b border-white/[0.065] px-6 py-6">
      <div className="relative flex flex-col gap-3 overflow-visible">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="SIWAKY"
          className="h-[44px] w-auto object-contain object-left"
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
    </div>
  );
}

// ── Mobile drawer ──────────────────────────────────────────────────────────────

type DrawerProps = { onNavigate: (id: string) => void; onClose: () => void };

export function DashboardSidebarDrawer({ onClose, onNavigate }: DrawerProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    const entry = dashboardNavEntries.find((e) => e.id === id);
    if (entry?.href) {
      onClose();
      router.push(entry.href);
      return;
    }
    // If not on the main dashboard, navigate there and close drawer
    if (pathname !== "/dashboard") {
      onClose();
      router.push("/dashboard");
      return;
    }
    setActiveId(id);
    onNavigate(id);
    // Drawer is closed by DashboardShell's handleNavigate (calls setDrawerOpen(false))
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: "#0e0e10" }}>
      {/* ── Close button ── */}
      <div className="flex shrink-0 justify-end px-4 pt-5 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/[0.12] px-5 py-2 font-dashSans text-[10px] font-bold uppercase tracking-[0.28em] text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/70"
          aria-label="Close navigation panel"
        >
          Close panel
        </button>
      </div>

      {/* ── Brand header ── */}
      <div className="shrink-0 border-b border-white/[0.07] px-6 pb-5 pt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="SIWAKY"
          className="h-[44px] w-auto object-contain object-left"
        />

        <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.22] bg-emerald-950/50 px-3 py-1.5">
          <span className="relative flex size-[7px] shrink-0">
            <span className="absolute size-full rounded-full bg-emerald-400/75 motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="relative size-full rounded-full bg-emerald-200" />
          </span>
          <span className="font-dashSans text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/88">
            Live Ledger
          </span>
        </div>

        <p className="mt-3 font-dashSans text-[12px] tracking-[0.03em] text-white/35">
          Navigate workspaces
        </p>
      </div>

      <div className="mx-5 my-1 h-px shrink-0 bg-white/[0.05]" />

      {/* ── Nav items ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavTiles items={dashboardNavEntries} onNavigate={handleNavigate} activeId={activeId} compact />
      </div>
    </div>
  );
}
