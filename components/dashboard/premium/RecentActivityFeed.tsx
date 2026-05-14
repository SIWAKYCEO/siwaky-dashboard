"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ActivityItem } from "@/lib/dashboard/analytics";

export function RecentActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const reduceMotion = useReducedMotion();

  if (!activity.length) {
    return (
      <div className="rounded-3xl border border-white/[0.07] px-8 py-10 text-center text-[13px] text-white/52">
        No activity lines yet — once orders stream in they’ll timeline here automatically.
      </div>
    );
  }

  return (
    <ul className="relative space-y-0 before:absolute before:left-[15px] before:top-2 before:z-0 before:h-[calc(100%-12px)] before:w-px before:bg-gradient-to-b before:from-[#c9a962]/45 before:via-white/10 before:to-transparent md:before:left-[19px]">
      {activity.map((row, idx) => (
        // eslint-disable-next-line react/no-array-index-key -- activity ids collide on duplicate orders
        <motion.li
          key={`${row.id}-${idx}`}
          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.035, duration: 0.32 }}
          className="relative z-[1]"
        >
          <div className="flex gap-4 py-4 pl-11 md:pl-14">
            <span className="absolute left-3 top-1/2 z-[2] mt-[-6px] size-3 shrink-0 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[5px] ring-[#28282a]/98 md:left-5">
              <span
                aria-hidden
                className={`block size-full rounded-full shadow-[0_0_14px_-2px_rgba(201,169,98,.6)] ring-4 ${row.dotClass} ${row.ringClass}`}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-white/[0.065] bg-gradient-to-br from-white/[0.05] via-[#29292c]/40 to-transparent p-4 shadow-glass backdrop-blur-xl md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="truncate font-dashDisplay text-[15px] font-semibold tracking-tight text-white">
                    {row.title}
                  </p>
                  <span className={`inline-flex max-w-[12rem] truncate rounded-full border border-white/[0.1] px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur ${row.ringClass} bg-black/35 ${row.textClass}`}>
                    <span aria-hidden className={`mr-1.5 mt-[3px] h-1.5 w-1.5 rounded-full ${row.dotClass}`} />
                    <span className="truncate">{row.badge}</span>
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-siwaky-muted">{row.subtitle}</p>
              </div>
              <p className="shrink-0 font-dashSans text-base font-semibold tabular-nums tracking-tight text-[#ebe2c9] md:pt-0.5 md:text-[15px]">
                {row.amount}
              </p>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
