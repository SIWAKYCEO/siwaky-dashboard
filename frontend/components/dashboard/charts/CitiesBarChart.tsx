"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RankedCity } from "@/lib/dashboard/analytics";

const tooltipSx = {
  backgroundColor: "rgba(37,37,41,0.96)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  fontSize: "12px",
};

export function CitiesBarChart({ cities }: { cities: RankedCity[] }) {
  const reduceMotion = useReducedMotion();
  const cols = [...cities].reverse();
  const max = Math.max(1, ...cols.map((c) => c.count));

  const fillFor = (c: RankedCity) =>
    `hsl(${35 + (c.count / max) * 40}, ${68 + (c.count / max) * 22}%, ${42 + (c.count / max) * 16}%)`;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[min(420px,68vh)] w-full min-w-0 overflow-hidden pb-6 sm:h-[460px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...cols]}
          layout="vertical"
          margin={{ top: 4, bottom: 4, left: 4, right: 28 }}
        >
          <XAxis hide type="number" />
          <YAxis
            type="category"
            dataKey="city"
            width={92}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipSx}
            formatter={(value) => {
              const raw = Array.isArray(value) ? value[0] : value;
              const n = typeof raw === "number" ? raw : Number(raw ?? 0);
              const safe = Number.isFinite(n) ? n : 0;
              return [`${safe} orders`, "Volume"];
            }}
            labelFormatter={(_lbl, pts) =>
              pts?.[0]?.payload
                ? `${String(pts[0].payload.city)} · mix ${String(pts[0].payload.pct)}%`
                : ""
            }
          />
          <Bar
            radius={[0, 10, 10, 0]}
            barSize={16}
            dataKey="count"
            isAnimationActive={!reduceMotion}
            animationDuration={900}
          >
            <LabelList
              dataKey="count"
              position="right"
              fill="rgba(255,255,255,0.6)"
              fontSize={11}
            />
            {cols.map((c, i) => (
              // eslint-disable-next-line react/no-array-index-key -- keys based on mutable city ranking
              <Cell key={`city-${i}`} fill={fillFor(c)} fillOpacity={0.95} stroke="rgba(255,255,255,0.06)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
