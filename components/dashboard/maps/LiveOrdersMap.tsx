"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PlacementPrecision } from "@/lib/dashboard/geo/orderCoordinates";
import {
  GCC_GLOBE_FOCUS_ORDER,
  GCC_GLOBE_PRESETS,
  GCC_MAP_FULL_EXTENT,
  GCC_MAP_VIEW_PRESETS,
  type GlobeFocusPreset,
  type MapBounds,
} from "@/lib/dashboard/geo/gccGlobePresets";

export type LiveMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  pulse: boolean;
  placement?: PlacementPrecision;
};

const MAP_W = 1000;
const MAP_H = 560;

type ViewBox = { x: number; y: number; w: number; h: number };

function padBounds(b: MapBounds, pad = 0.06): MapBounds {
  const latSpan = b.north - b.south;
  const lngSpan = b.east - b.west;
  const la = latSpan * pad;
  const lo = lngSpan * pad;
  return {
    south: Math.max(GCC_MAP_FULL_EXTENT.south, b.south - la),
    north: Math.min(GCC_MAP_FULL_EXTENT.north, b.north + la),
    west: Math.max(GCC_MAP_FULL_EXTENT.west, b.west - lo),
    east: Math.min(GCC_MAP_FULL_EXTENT.east, b.east + lo),
  };
}

function boundsToViewBox(full: MapBounds, view: MapBounds, w: number, h: number): ViewBox {
  const x =
    ((view.west - full.west) / (full.east - full.west)) * w;
  const bw = ((view.east - view.west) / (full.east - full.west)) * w;
  const y =
    ((full.north - view.north) / (full.north - full.south)) * h;
  const bh = ((view.north - view.south) / (full.north - full.south)) * h;
  const minDim = 24;
  return {
    x,
    y,
    w: Math.max(minDim, bw),
    h: Math.max(minDim, bh),
  };
}

function projectLatLng(full: MapBounds, lat: number, lng: number, w: number, h: number) {
  const x = ((lng - full.west) / (full.east - full.west)) * w;
  const y = ((full.north - lat) / (full.north - full.south)) * h;
  return { x, y };
}

function lerpView(a: ViewBox, b: ViewBox, t: number): ViewBox {
  const e = 1 - Math.pow(1 - t, 3);
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    w: a.w + (b.w - a.w) * e,
    h: a.h + (b.h - a.h) * e,
  };
}

function useSpringViewBox(preset: GlobeFocusPreset, reduceMotion: boolean) {
  const target = useMemo(() => {
    return boundsToViewBox(
      GCC_MAP_FULL_EXTENT,
      padBounds(GCC_MAP_VIEW_PRESETS[preset]),
      MAP_W,
      MAP_H,
    );
  }, [preset]);

  const [vb, setVb] = useState<ViewBox>(() =>
    boundsToViewBox(GCC_MAP_FULL_EXTENT, padBounds(GCC_MAP_VIEW_PRESETS.world), MAP_W, MAP_H),
  );
  const vbRef = useRef(vb);
  vbRef.current = vb;
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setVb(target);
      return;
    }
    const from = vbRef.current;
    const to = target;
    const start = performance.now();
    const duration = 820;

    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const next = lerpView(from, to, t);
      setVb(next);
      if (t < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, reduceMotion]);

  return vb;
}

function GridLines({ full, w, h }: { full: MapBounds; w: number; h: number }) {
  const vLines: number[] = [];
  const hLines: number[] = [];
  for (let lng = Math.ceil(full.west); lng <= full.east; lng += 4) vLines.push(lng);
  for (let lat = Math.ceil(full.south); lat <= full.north; lat += 4) hLines.push(lat);

  return (
    <g className="pointer-events-none" opacity={0.38}>
      {vLines.map((lng) => {
        const x1 = ((lng - full.west) / (full.east - full.west)) * w;
        return (
          <line
            key={`v-${lng}`}
            x1={x1}
            y1={0}
            x2={x1}
            y2={h}
            stroke="#b8b3a8"
            strokeWidth={0.35}
            strokeDasharray="4 7"
          />
        );
      })}
      {hLines.map((lat) => {
        const y = ((full.north - lat) / (full.north - full.south)) * h;
        return (
          <line
            key={`h-${lat}`}
            x1={0}
            y1={y}
            x2={w}
            y2={y}
            stroke="#b8b3a8"
            strokeWidth={0.35}
            strokeDasharray="4 7"
          />
        );
      })}
    </g>
  );
}

function OrderDot({
  cx,
  cy,
  pulse,
  placement,
  reduceMotion,
}: {
  cx: number;
  cy: number;
  pulse: boolean;
  placement: PlacementPrecision;
  reduceMotion: boolean;
}) {
  const r = placement === "city" ? 5.2 : 6.2;
  const strokeW = placement === "city" ? 1.8 : 2;

  return (
    <g transform={`translate(${cx},${cy})`}>
      {pulse && !reduceMotion ? (
        <motion.circle
          r={r + 2}
          fill="none"
          stroke="#c9a962"
          strokeOpacity={0.5}
          strokeWidth={1.2}
          initial={{ r: r + 2, opacity: 0.9 }}
          animate={{ r: r + 26, opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], repeat: 2, repeatDelay: 0.12 }}
        />
      ) : null}
      <circle r={r + 9} fill="#c9a962" opacity={0.14} />
      <circle r={r} fill="#fffdf8" stroke="#b8944a" strokeWidth={strokeW} />
      <circle r={1.85} fill="#c9a962" opacity={0.92} />
    </g>
  );
}

export default function LiveOrdersMap({ markers }: { markers: LiveMapMarker[] }) {
  const reduceMotion = useReducedMotion();
  const [preset, setPreset] = useState<GlobeFocusPreset>("world");
  const vb = useSpringViewBox(preset, Boolean(reduceMotion));

  const viewBoxStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  const projected = useMemo(() => {
    return markers.map((m) => ({
      m,
      ...projectLatLng(GCC_MAP_FULL_EXTENT, m.lat, m.lng, MAP_W, MAP_H),
    }));
  }, [markers]);

  const onDoubleClick = useCallback(() => {
    setPreset("gcc");
  }, []);

  return (
    <div className="relative isolate h-[min(58vh,640px)] min-h-[320px] w-full overflow-hidden rounded-[1.35rem] border border-[#c9a962]/28 bg-[linear-gradient(165deg,#faf7f0_0%,#f0ebe2_45%,#e6dfd3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_24px_80px_-32px_rgba(55,45,32,0.28)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_-20%,rgba(201,169,98,0.14),transparent_50%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
      />

      <div
        className="relative z-[3] flex h-full min-h-[inherit] w-full flex-col px-3 pb-2 pt-3 sm:px-4 sm:pb-3 sm:pt-4"
        onDoubleClick={onDoubleClick}
        role="presentation"
        title="Double-click to snap to GCC"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[8] flex justify-between gap-3 p-3 sm:p-4">
          <div className="pointer-events-auto relative max-w-[min(96%,420px)] overflow-hidden rounded-2xl border border-[#c9a962]/22 bg-white/82 px-3.5 py-2.5 text-[11px] leading-snug text-[#2a2826] shadow-[0_20px_60px_-36px_rgba(40,35,28,0.45)] backdrop-blur-md [text-rendering:geometricPrecision] sm:px-4 sm:py-3">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#c9a962]/10 to-transparent motion-safe:animate-globe-hud-shimmer motion-reduce:animate-none"
            />
            <p className="relative font-dashSans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8a7348]">
              Live operations map · GCC
            </p>
            <p className="relative mt-1.5 text-[12px] text-[#4a4640]">
              Light tactical view — zoom presets along the Gulf; dots follow city-level fixes when your sheet has them.
              New orders pulse softly. Double-tap/click the map area to jump to GCC.
            </p>
          </div>
        </div>

        <div className="relative mt-[7.5rem] min-h-0 flex-1 sm:mt-[6.25rem]">
          <svg
            className="h-full w-full touch-pan-y select-none"
            viewBox={viewBoxStr}
            preserveAspectRatio="xMidYMid meet"
            style={{ minHeight: "clamp(220px, 42vh, 420px)" }}
          >
            <defs>
              <linearGradient id="siwakyMapSea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dfeaf5" />
                <stop offset="100%" stopColor="#d0dde8" />
              </linearGradient>
              <linearGradient id="siwakyMapLand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f3efe6" />
                <stop offset="100%" stopColor="#e8e2d5" />
              </linearGradient>
            </defs>

            <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#siwakyMapSea)" />
            <rect
              x={
                ((GCC_MAP_VIEW_PRESETS.gcc.west - GCC_MAP_FULL_EXTENT.west) /
                  (GCC_MAP_FULL_EXTENT.east - GCC_MAP_FULL_EXTENT.west)) *
                MAP_W
              }
              y={
                ((GCC_MAP_FULL_EXTENT.north - GCC_MAP_VIEW_PRESETS.gcc.north) /
                  (GCC_MAP_FULL_EXTENT.north - GCC_MAP_FULL_EXTENT.south)) *
                MAP_H
              }
              width={
                ((GCC_MAP_VIEW_PRESETS.gcc.east - GCC_MAP_VIEW_PRESETS.gcc.west) /
                  (GCC_MAP_FULL_EXTENT.east - GCC_MAP_FULL_EXTENT.west)) *
                MAP_W
              }
              height={
                ((GCC_MAP_VIEW_PRESETS.gcc.north - GCC_MAP_VIEW_PRESETS.gcc.south) /
                  (GCC_MAP_FULL_EXTENT.north - GCC_MAP_FULL_EXTENT.south)) *
                MAP_H
              }
              rx={18}
              fill="url(#siwakyMapLand)"
              opacity={0.92}
            />

            <GridLines full={GCC_MAP_FULL_EXTENT} w={MAP_W} h={MAP_H} />

            <text
              x={40}
              y={46}
              fill="#7a7268"
              fontSize={22}
              fontFamily="ui-sans-serif, system-ui"
              fontWeight={600}
              style={{ letterSpacing: "0.04em" }}
            >
              Arabian Gulf · live orders
            </text>
            <text
              x={40}
              y={72}
              fill="#9a9288"
              fontSize={12}
              fontFamily="ui-sans-serif, system-ui"
            >
              City-level placement when available · GCC bounds from sheet + fuzzy city match
            </text>

            {projected.map(({ m, x, y }) => (
              <OrderDot
                key={m.id}
                cx={x}
                cy={y}
                pulse={m.pulse}
                placement={m.placement ?? "country"}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </svg>
        </div>

        <div className="pointer-events-none relative z-[8] mt-2 flex justify-center px-1 pb-1 sm:mt-3 sm:px-2">
          <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] sm:gap-2 [&::-webkit-scrollbar]:hidden">
            {GCC_GLOBE_FOCUS_ORDER.map((key) => {
              const cfg = GCC_GLOBE_PRESETS[key];
              const active = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  aria-label={`Map focus ${cfg.label}`}
                  aria-pressed={active}
                  title={cfg.label}
                  className={`shrink-0 touch-manipulation rounded-full border px-3 py-2 font-dashSans text-[9px] font-semibold uppercase tracking-[0.18em] shadow-[0_10px_36px_-22px_rgba(80,70,55,0.35)] [-webkit-tap-highlight-color:transparent] motion-safe:transition-all motion-safe:duration-300 sm:px-3.5 sm:text-[10px] sm:tracking-[0.2em] ${
                    active
                      ? "border-[#c9a962]/70 bg-[#2a2826] text-[#f9f4e6]"
                      : "border-[#c9a962]/25 bg-white/90 text-[#3d3a36] hover:border-[#c9a962]/45 hover:bg-white"
                  }`}
                >
                  {cfg.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
