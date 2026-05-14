"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/shell/DashboardShell";
import { CitiesBarChart } from "@/components/dashboard/charts/CitiesBarChart";
import { ProductsLeaderboard } from "@/components/dashboard/charts/ProductsLeaderboard";
import { RevenueAreaChart } from "@/components/dashboard/charts/RevenueAreaChart";
import { FulfillmentGauges } from "@/components/dashboard/premium/FulfillmentGauges";
import { MetricsCommandDeck } from "@/components/dashboard/premium/MetricsCommandDeck";
import { RecentActivityFeed } from "@/components/dashboard/premium/RecentActivityFeed";
import { GlassPanel } from "@/components/dashboard/ui/GlassPanel";
import { SectionLabel } from "@/components/dashboard/ui/SectionLabel";
import { fetchOrders } from "@/lib/dashboard/api";
import { buildDashboardAnalytics } from "@/lib/dashboard/analytics";
import { computeOrderKpis, latestOrders } from "@/lib/dashboard/kpi";
import type { OrdersPayload } from "@/lib/dashboard/types";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

import { OrderFeed } from "./OrderFeed";
import { PremiumSkeleton } from "./PremiumSkeleton";
import { PwaInstallButton } from "./PwaInstallButton";

function RefreshAura({ pullPx, refreshing }: { pullPx: number; refreshing: boolean }) {
  const progress = Math.min(pullPx / 88, 1);
  const active = refreshing || progress > 0.12;
  if (!active) return null;

  return (
    <div
      className="pointer-events-none flex justify-center pb-3 pt-4"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-px w-32 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-[#c9a962]/70 to-transparent" />
        <div
          className={`relative h-11 w-11 rounded-full border border-white/10 bg-black/50 shadow-[0_0_40px_-6px_rgba(201,169,98,.7)] backdrop-blur-md motion-safe:duration-200 ${
            refreshing ? "animate-spin motion-reduce:animate-none" : ""
          }`}
          style={{
            opacity: refreshing ? 1 : Math.max(0.42, Math.min(progress, 1)),
            transform: refreshing ? undefined : `scale(${0.86 + progress * 0.18})`,
          }}
        >
          <div className="pointer-events-none absolute inset-[7px] rounded-full border-[2.5px] border-transparent border-t-[#c9a962]/95" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.42em] text-white/52">
          {refreshing ? "Syncing workbook…" : "Release to sync"}
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [payload, setPayload] = useState<OrdersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncIso, setLastSyncIso] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchOrders();
      setPayload(data);
      setLastSyncIso(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qualcosa è andato storto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const { bindScrollRef, pullPx, refreshing } = usePullToRefresh({
    onRefresh: loadOrders,
    thresholdPx: 68,
  });

  const analytics = useMemo(
    () => buildDashboardAnalytics(payload?.orders ?? []),
    [payload],
  );

  const kpisWarm = useMemo(
    () => computeOrderKpis(payload?.orders ?? []),
    [payload],
  );

  const feed = useMemo(() => latestOrders(payload?.orders ?? [], 52), [payload]);

  const pwaSlot = (
    <span className="hidden sm:flex">
      <PwaInstallButton className="w-auto max-w-none whitespace-nowrap border-white/[0.12] px-4 py-2 text-[10px] tracking-[0.2em] shadow-glass backdrop-blur-xl" />
    </span>
  );

  const bodyLoading = loading;
  const bodyError = !loading && error != null && error !== "";
  const bodyReady =
    !loading && error == null && payload != null;

  return (
    <DashboardShell
      bindScrollRef={bindScrollRef}
      refreshing={refreshing}
      onRefresh={loadOrders}
      payload={payload}
      lastSyncIso={lastSyncIso}
      pwaSlot={pwaSlot}
    >
      <>
        <div style={{ height: refreshing ? Math.max(48, pullPx) : pullPx }} className="flex justify-center">
          <div className="w-full">
            {(pullPx > 8 || refreshing) && (
              <RefreshAura pullPx={pullPx} refreshing={refreshing} />
            )}
          </div>
        </div>

        {bodyLoading ? (
          <>
            <div className="sr-only">Loading dashboard workspace</div>
            <PremiumSkeleton />
          </>
        ) : null}

        {bodyError ? (
          <GlassPanel outerClassName="max-w-xl" className="p-8 md:p-10">
            <p className="font-dashDisplay text-xl font-semibold text-white">
              Connectivity / backend
            </p>
            <p className="mt-5 text-[14px] leading-relaxed text-rose-100/92">{error}</p>
            <p className="mt-7 text-[12px] leading-relaxed text-white/53">
              FastAPI snapshot should expose{" "}
              <code className="rounded-md border border-white/12 bg-black/37 px-1.5 py-0.5 text-white/80">
                /orders
              </code>
              locally on{" "}
              <code className="rounded-md border border-white/12 bg-black/37 px-1.5 py-0.5 text-white/80">
                127.0.0.1:8000
              </code>{" "}
              with{" "}
              <code className="rounded-md border border-white/12 bg-black/37 px-1.5 py-0.5 text-white/75">
                NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
              </code>
              .
            </p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-9 w-full rounded-2xl border border-white/[0.14] bg-gradient-to-br from-white/[0.08] via-black/40 to-black/55 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-[0_18px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-md motion-safe:hover:border-[#c9a962]/45"
            >
              Retry handshake
            </button>
          </GlassPanel>
        ) : null}

        {bodyReady ? (
          <div className="space-y-16 md:space-y-[4.75rem]">
            <section id="pulse" className="space-y-9 scroll-mt-28 xl:scroll-mt-[7rem]">
              <SectionLabel
                eyebrow="Executive overview"
                title={
                  <>
                    Signal clarity across{" "}
                    <span className="bg-gradient-to-r from-[#f5efd9] via-white to-emerald-200/90 bg-clip-text text-transparent">
                      {analytics.kpis.totalOrders.toLocaleString("en-US")} concierge rows
                    </span>
                  </>
                }
                action={
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/43 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/72 shadow-inner backdrop-blur-md lg:hidden">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex size-full rounded-full bg-emerald-400/92 motion-safe:animate-ping motion-reduce:animate-none" />
                      <span className="relative m-auto inline-flex size-[5px] rounded-full bg-emerald-200 shadow-[0_0_14px_-1px_rgba(167,243,208,.9)]" />
                    </span>
                    KPI fabric v2
                  </span>
                }
              />

              <MetricsCommandDeck analytics={analytics} orders={payload.orders} />

          <div className="grid min-w-0 gap-7 lg:grid-cols-12 lg:gap-8">
                <GlassPanel outerClassName="min-w-0 lg:col-span-7 xl:col-span-7" className="p-7 sm:p-8">
                  <SectionLabel
                    eyebrow="Revenue radar"
                    title="Momentum across segmented sheet windows."
                    action={
                      <span className="rounded-full border border-white/[0.08] bg-black/43 px-3 py-[6px] text-[11px] text-white/60 shadow-inner backdrop-blur-md tabular-nums">
                        Returned {analytics.kpis.returnedCount.toLocaleString("en-US")}
                      </span>
                    }
                  />
                  <RevenueAreaChart data={analytics.revenueBuckets} />
                </GlassPanel>
                <div className="min-w-0 space-y-4 lg:col-span-5">
                  <p className="px-1 font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-white/54">
                    Delivery & confirmations
                  </p>
                  <FulfillmentGauges
                    deliveryRatePct={analytics.deliveryRatePct}
                    confirmationRatePct={analytics.confirmationRatePct}
                  />
                  <GlassPanel className="p-7">
                    <p className="text-[13px] leading-relaxed text-siwaky-muted">
                      Totals reconcile to{" "}
                      <strong className="font-semibold text-white/92">
                        {kpisWarm.totalOrders.toLocaleString("en-US")} indexed rows
                      </strong>{" "}
                      feeding{" "}
                      <strong className="tabular-nums text-[#ebe2c9]">
                        {Intl.NumberFormat("en-SA", {
                          style: "currency",
                          currency: "SAR",
                          maximumFractionDigits: 0,
                        }).format(analytics.kpis.totalRevenue)}
                      </strong>{" "}
                      gross merchandise value.
                    </p>
                  </GlassPanel>
                </div>
              </div>
            </section>

            <section id="regions" className="scroll-mt-28 xl:scroll-mt-[7rem]">
              <GlassPanel outerClassName="min-w-0 overflow-hidden">
                <div className="p-7 pb-10 sm:p-9">
                  <SectionLabel
                    eyebrow="Geospatial intelligence"
                    title="Fulfillment hotspots by city dominance."
                  />
                  <CitiesBarChart cities={analytics.cities} />
                </div>
              </GlassPanel>
            </section>

            <section id="catalog" className="scroll-mt-28 xl:scroll-mt-[7rem]">
              <GlassPanel outerClassName="min-w-0" className="p-8 sm:p-10">
                <SectionLabel
                  eyebrow="Merchandise OS"
                  title="SKU-level leaderboard by realized SAR."
                  action={
                    <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/43 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72 shadow-inner backdrop-blur-md tabular-nums">
                      Spotlight on top {Math.min(analytics.products.length, 10)} movers
                    </span>
                  }
                />
                <ProductsLeaderboard products={analytics.products} />
              </GlassPanel>
            </section>

            <section id="live" className="scroll-mt-28 xl:scroll-mt-[7rem] space-y-7">
              <SectionLabel
                eyebrow="Real-time tableau"
                title="Operational ledger stitched with SKU pipeline."
              />
              <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.06fr)]">
                <GlassPanel outerClassName="min-w-0" className="p-8 sm:p-9">
                  <div className="mb-10 flex flex-wrap items-start justify-between gap-4 px-1">
                    <div>
                      <p className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-siwaky-muted">
                        Event stream
                      </p>
                      <p className="mt-2 font-dashDisplay text-lg font-semibold text-white md:text-xl">
                        Latest interactions
                      </p>
                      <p className="mt-3 max-w-sm text-[12px] text-siwaky-muted leading-relaxed">
                        Pulled chronologically — mirroring concierge desk chatter inside the sheet.
                      </p>
                    </div>
                  </div>
                  <RecentActivityFeed activity={analytics.activity} />
                </GlassPanel>
                <div className="min-w-0">
                  <OrderFeed orders={feed} />
                </div>
              </div>
            </section>
          </div>
        ) : null}

      </>
    </DashboardShell>
  );
}
