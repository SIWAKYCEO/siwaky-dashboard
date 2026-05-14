"use client";

import type { ActivityItem } from "@/lib/dashboard/analytics";

import { StatusBadge } from "@/components/dashboard/ui/StatusBadge";

const DEFAULT_LIMIT = 28;

export function RecentActivityFeed({
  activity,
  limit = DEFAULT_LIMIT,
}: {
  activity: ActivityItem[];
  limit?: number;
}) {
  const rows = activity.slice(0, Math.max(0, limit));

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.12] bg-black/28 px-8 py-12 text-center text-[13px] text-white/52 backdrop-blur-sm">
        Order activity will appear here once fresh rows sync from your sheet.
      </div>
    );
  }

  return (
    <div className="relative max-h-[min(52vh,560px)] overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
      <ul className="relative space-y-3 pb-2 before:absolute before:left-[41px] before:top-[10px] before:z-[0] before:h-[calc(100%-24px)] before:w-[1px] before:bg-gradient-to-b before:from-[#c9a962]/50 before:via-white/10 before:to-transparent md:before:left-[45px]">
        {rows.map((row, idx) => (
          // eslint-disable-next-line react/no-array-index-key -- ids may repeat on duplicate sheet rows
          <li key={`${row.id}-${idx}`} className="relative z-[1]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] via-[#29292d]/92 to-transparent px-6 py-[18px] shadow-glass backdrop-blur-2xl">
              <span className="pointer-events-none absolute -right-[18%] top-[-50%] h-[260%] w-[48%] rotate-[18deg] bg-gradient-to-bl from-transparent via-transparent to-[#c9a962]/10 opacity-80" />

              <div className="relative flex gap-5 md:gap-6">
                <span
                  aria-hidden
                  className={`mt-2 hidden h-[11px] w-[11px] flex-none shrink-0 rounded-full ring-[6px] ring-[#28282a] sm:block ${row.dotClass} ${row.ringClass}`}
                />
                <span
                  aria-hidden
                  className={`mt-[6px] h-[11px] w-[11px] flex-none shrink-0 rounded-full ring-[6px] ring-[#28282a] sm:hidden ${row.dotClass} ${row.ringClass}`}
                />

                <div className="min-w-0 flex-1 space-y-3 md:pb-px">
                  <div className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-[10px] gap-y-[6px]">
                        <span className={`truncate font-dashDisplay text-[16px] font-semibold leading-snug text-white md:text-[17px] ${row.textClass}`}>
                          {row.title}
                        </span>
                        <StatusBadge
                          accent={{
                            label: row.badge,
                            dotClass: row.dotClass,
                            ringClass: row.ringClass,
                            textClass: row.textClass,
                          }}
                        />
                      </div>
                      {row.subtitle ? (
                        <p className="truncate text-[13px] text-white/[0.61]">{row.subtitle}</p>
                      ) : null}
                    </div>
                    <span className="rounded-[1rem] border border-white/[0.12] bg-black/[0.53] px-4 py-2 text-right font-dashSans text-sm font-semibold tabular-nums text-[#f4eed9] shadow-inner backdrop-blur-md">
                      {row.amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
