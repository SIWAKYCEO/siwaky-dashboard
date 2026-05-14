"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RevenueBucket } from "@/lib/dashboard/analytics";

const tooltipSx = {
  backgroundColor: "rgba(37,37,41,0.96)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
};

function formatSAR(v: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function RevenueAreaChart({ data }: { data: RevenueBucket[] }) {
  const reduceMotion = useReducedMotion();
  const empty = data.length === 0 || data.every((d) => d.revenue === 0);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative flex h-[300px] w-full min-w-0 flex-col overflow-hidden md:h-[320px]"
    >
      {empty ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[#28282a]/70 text-center backdrop-blur-sm">
          <p className="max-w-xs text-[13px] text-white/55">
            Add more sheet rows — trend segments build from order revenue windows.
          </p>
        </div>
      ) : null}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, left: -12, right: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="siwakyRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a962" stopOpacity={0.45} />
              <stop offset="55%" stopColor="#6ee7b7" stopOpacity={0.09} />
              <stop offset="100%" stopColor="#28282a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            hide
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipSx}
            formatter={(value: unknown) => [formatSAR(Number(value)), "Revenue"]}
            labelFormatter={(_lbl, payload) => {
              const row = payload?.[0]?.payload as RevenueBucket | undefined;
              return row?.rowSpan ?? "Segment";
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#c9a962"
            strokeWidth={2}
            fill="url(#siwakyRev)"
            isAnimationActive={!reduceMotion}
            animationDuration={1100}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#f5efd7" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
