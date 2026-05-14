"use client";

import type { ReactNode } from "react";
import { type RefCallback, useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { scrollToDashboardSection } from "@/components/dashboard/shell/dashboardNav";
import { DashboardSidebarDrawer, DashboardSidebarRail } from "@/components/dashboard/shell/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/shell/DashboardTopBar";

import type { OrdersPayload } from "@/lib/dashboard/types";

type Props = {
  children: ReactNode;
  bindScrollRef: RefCallback<HTMLDivElement>;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  payload: OrdersPayload | null;
  lastSyncIso: string | null;
  pwaSlot: ReactNode;
  viewerEmail?: string | null;
};

export function DashboardShell({
  children,
  bindScrollRef,
  refreshing,
  onRefresh,
  payload,
  lastSyncIso,
  pwaSlot,
  viewerEmail,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = useCallback((id: string) => {
    scrollToDashboardSection(id);
    setDrawerOpen(false);
  }, []);

  return (
    <div dir="ltr" className="relative isolate flex min-h-[100dvh] w-full min-w-0 overflow-x-hidden text-white">
      {/* Decorative layers — clipped to viewport to avoid sideways scroll */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 mx-auto h-[min(560px,70vh)] max-w-[100vw] bg-[radial-gradient(ellipse_at_50%_-10%,rgba(201,169,98,0.12),transparent_72%)]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-siwaky-bg" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-lux-gradient opacity-[0.72]" />

      <div className="relative z-[1] flex min-h-[100dvh] w-full min-w-0 overflow-x-hidden">
        <aside className="hidden shrink-0 xl:block">
          <DashboardSidebarRail onNavigate={handleNavigate} />
        </aside>

        <AnimatePresence>
          {drawerOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] xl:hidden"
            >
              <button
                type="button"
                aria-label="Dismiss navigation drawer"
                className="absolute inset-0 bg-black/55 backdrop-blur-md"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: "-102%" }}
                animate={{ x: 0 }}
                exit={{ x: "-102%" }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-[71] flex h-[100dvh] min-h-[100dvh] w-[min(88vw,300px)] max-w-[100vw] overflow-x-hidden shadow-[24px_0_80px_rgba(0,0,0,0.45)]"
              >
                <DashboardSidebarDrawer onClose={() => setDrawerOpen(false)} onNavigate={handleNavigate} />
              </motion.aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          <DashboardTopBar
            payload={payload}
            lastSyncIso={lastSyncIso}
            onRefresh={() => void onRefresh()}
            onOpenDrawer={() => setDrawerOpen(true)}
            pwaInstall={pwaSlot}
            syncing={refreshing}
            viewerEmail={viewerEmail}
          />
          <div
            ref={bindScrollRef}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain pb-16 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
          >
            <div className="relative mx-auto w-full min-w-0 max-w-[1540px] flex-1 border-white/[0.04] px-4 pb-24 pt-3 sm:px-6 xl:border-l xl:border-white/[0.05] xl:px-10 xl:pt-8 xl:backdrop-blur-[2px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
