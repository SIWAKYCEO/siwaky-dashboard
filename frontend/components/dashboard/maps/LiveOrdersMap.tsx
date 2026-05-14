"use client";

/**
 * Shopify-style live Gulf map — single-component implementation.
 * Data + sound: parent polls orders (30s) and runs {@link DashboardAlertsProvider} on newcomers.
 */

import { motion, useReducedMotion } from "framer-motion";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";

import { formatSar, latestOrders, lineRevenue } from "@/lib/dashboard/kpi";
import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

/** Natural Earth TopoJSON shipped as world-atlas (110m countries). */
const GEOGRAPHY_TOPOLOGY_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COLOR_OCEAN = "#0a1628";
const COLOR_OTHER = "#0f1a2e";
/** Premium country fills keyed by ISO 3166-1 alpha-3 where applicable */
const C = {
  SAU: "#1a3d2b",
  ARE: "#1a2d4a",
  KWT: "#1f3550",
  QAT: "#1f3550",
  BHR: "#1f3550",
  OMN: "#1f3550",
  EGY: "#2d2a1e",
  IRQ: "#2a2a1a",
  JOR: "#2a2a1a",
  YEM: "#1a2a1a",
  TUR: "#1a2535",
  IRN: "#2a1a1a",
} as const;

const COLOR_BORDER_STANDARD = "rgba(201, 168, 76, 0.25)";
const COLOR_BORDER_SAUDI = "rgba(201, 168, 76, 0.6)";
const GOLD = "#c9a84c";
const FRAME_GOLD = "rgba(201, 168, 76, 0.5)";

/** Saudi-aligned — tighter default framing on GCC */
const GCC_DEFAULT_CENTER: [number, number] = [45.1, 24.35];
const GCC_DEFAULT_ZOOM = 2.05;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.35;

function mixTowardWhite(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lerp = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${lerp(r)}, ${lerp(g)}, ${lerp(b)})`;
}

function countryFillPair(iso: string | null, name: string): { base: string; hover: string } {
  const n = name.toLowerCase();
  let base = COLOR_OTHER;

  if (iso === "SAU" || /saudi/.test(n)) base = C.SAU;
  else if (iso === "ARE" || /united arab emirates/.test(n) || /\bu\.?a\.?e\.?\b/.test(n)) base = C.ARE;
  else if (iso === "KWT") base = C.KWT;
  else if (iso === "QAT") base = C.QAT;
  else if (iso === "BHR") base = C.BHR;
  else if (iso === "OMN") base = C.OMN;
  else if (iso === "EGY") base = C.EGY;
  else if (iso === "IRQ") base = C.IRQ;
  else if (iso === "JOR") base = C.JOR;
  else if (iso === "YEM") base = C.YEM;
  else if (iso === "TUR") base = C.TUR;
  else if (iso === "IRN") base = C.IRN;

  return { base, hover: mixTowardWhite(base, 0.12) };
}

/** GCC hub coordinates [lng, lat] — unknown sheet city maps to Riyadh. */
const CITY_COORDS = {
  riyadh: { lng: 46.6753, lat: 24.7136, label: "Riyadh", labelAr: "الرياض" },
  jeddah: { lng: 39.1925, lat: 21.4858, label: "Jeddah", labelAr: "جدة" },
  dammam: { lng: 50.0888, lat: 26.4207, label: "Dammam", labelAr: "الدمام" },
  makkah: { lng: 39.8579, lat: 21.3891, label: "Makkah", labelAr: "مكة" },
  madinah: { lng: 39.5692, lat: 24.5247, label: "Madinah", labelAr: "المدينة" },
  dubai: { lng: 55.2708, lat: 25.2048, label: "Dubai", labelAr: "دبي" },
  abudhabi: { lng: 54.3773, lat: 24.4539, label: "Abu Dhabi", labelAr: "أبوظبي" },
  kuwaitcity: { lng: 47.9774, lat: 29.3759, label: "Kuwait City", labelAr: "الكويت" },
  doha: { lng: 51.531, lat: 25.2854, label: "Doha", labelAr: "الدوحة" },
} as const;

const DEFAULT_SLUG: keyof typeof CITY_COORDS = "riyadh";

type CitySlug = keyof typeof CITY_COORDS;

function normalizeCitySlug(raw: string | undefined): CitySlug {
  const s = (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, "");

  if (!s) return DEFAULT_SLUG;
  const tokens = [
    s,
    ...s.replace(/[,/]/g, " ").split(/\s+/).filter((t) => t.length >= 3),
  ];
  const dict: Partial<Record<string, CitySlug>> = {
    riyadh: "riyadh",
    riyad: "riyadh",
    arriyadh: "riyadh",
    jeddah: "jeddah",
    jiddah: "jeddah",
    dammam: "dammam",
    dhahran: "dammam",
    khobar: "dammam",
    makkah: "makkah",
    mecca: "makkah",
    madinah: "madinah",
    medina: "madinah",
    dubai: "dubai",
    dubayy: "dubai",
    abudhabi: "abudhabi",
    sharjah: "dubai",
    doha: "doha",
    qatar: "doha",
    kuwait: "kuwaitcity",
    kuwaitcity: "kuwaitcity",
  };

  if (dict[s]) return dict[s]!;

  const hit = tokens.find((t) => dict[t]);
  return hit && dict[hit] ? dict[hit]! : DEFAULT_SLUG;
}

function resolveCitySlug(order: OrderRow): CitySlug {
  return normalizeCitySlug(order.city);
}

function iso3FromProperties(properties: GeoProperties | undefined): string | null {
  if (!properties) return null;
  const iso =
    trimIso(asOptionalString(properties.ISO_A3)) ??
    trimIso(asOptionalString(properties.iso_a3));

  if (iso === "ATA") return iso;
  if (/^[A-Z]{3}$/.test(iso ?? "")) return iso!;
  return null;
}

function trimIso(v?: string): string | null {
  const t = typeof v === "string" ? v.trim().toUpperCase() : "";
  return t.length >= 3 ? t.slice(0, 3) : null;
}

type GeoProperties = Record<string, unknown>;

type RawGeoFeature = { properties?: GeoProperties };

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Strip Antarctica meshes for quieter rendering. */
function parseExcludeAntarctica(feats: RawGeoFeature[]): RawGeoFeature[] {
  return feats.filter((geo) => {
    const iso = iso3FromProperties(geo.properties);
    if (iso === "ATA") return false;
    const n = String(geo.properties?.NAME ?? "").toLowerCase().trim();
    return n !== "antarctica";
  });
}

export type LiveOrdersMapProps = {
  orders: OrderRow[];
  pulseOrderFingerprints: Set<string>;
};

type CityAgg = {
  slug: CitySlug;
  lng: number;
  lat: number;
  label: string;
  orderCount: number;
  totalSar: number;
  pulse: boolean;
};

function aggregateByCity(
  orders: OrderRow[],
  pulseFp: ReadonlySet<string>,
): Map<CitySlug, CityAgg> {
  const map = new Map<CitySlug, CityAgg>();

  const ensure = (slug: CitySlug) => {
    const def = CITY_COORDS[slug];
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        lng: def.lng,
        lat: def.lat,
        label: def.label,
        orderCount: 0,
        totalSar: 0,
        pulse: false,
      });
    }
    return map.get(slug)!;
  };

  for (const order of orders) {
    const slug = resolveCitySlug(order);
    const row = ensure(slug);
    row.orderCount += 1;
    row.totalSar += lineRevenue(order);

    if (pulseFp.has(stableOrderFingerprint(order))) {
      row.pulse = true;
    }
  }

  const used = new Map<CitySlug, CityAgg>();
  for (const [slug, v] of map) {
    if (v.orderCount > 0) used.set(slug, v);
  }
  return used;
}

/** Beacon core radius scaled vs busiest city hub (order counts). */
function beaconCoreRadiusPx(orderCount: number, maxOrders: number): number {
  const lo = 2.75;
  const hi = 12;
  if (maxOrders <= 0 || orderCount <= 0) return lo + (hi - lo) * 0.18;
  const t = Math.sqrt(Math.min(1, orderCount / maxOrders));
  return lo + t * (hi - lo);
}

type PreparedGeo = {
  rsmKey: string;
  properties?: GeoProperties;
  svgPath: string;
};

type GeographiesRenderArgs = {
  geographies: PreparedGeo[];
  borders?: { svgPath: string };
};

type CountryHoverEmit = (
  payload: null | {
    /** English display label from TopoJSON NAME */
    name: string;
    clientX: number;
    clientY: number;
  },
) => void;

const GeoPath = memo(function GeoLayer(props: {
  width: number;
  height: number;
  emitCountryHover: CountryHoverEmit;
}) {
  const { width, height, emitCountryHover } = props;

  function findSaudi(geographies: PreparedGeo[]): PreparedGeo | undefined {
    return geographies.find((g) => {
      const iso = iso3FromProperties(g.properties);
      const nm = String(g.properties?.NAME ?? "");
      return iso === "SAU" || /saudi/i.test(nm);
    });
  }

  return (
    <Geographies geography={GEOGRAPHY_TOPOLOGY_URL} parseGeographies={parseExcludeAntarctica}>
      {({ geographies, borders }: GeographiesRenderArgs) => {
        const saudiOutline = findSaudi(geographies);
        return (
          <>
            {geographies.map((geo) => {
              const iso = iso3FromProperties(geo.properties);
              const name = String(geo.properties?.NAME ?? "Unknown").trim();
              const { base, hover } = countryFillPair(iso, name);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo as object}
                  onMouseEnter={(e: ReactMouseEvent<SVGPathElement>) => {
                    emitCountryHover({
                      name: name.length ? name : "Unknown territory",
                      clientX: e.clientX,
                      clientY: e.clientY,
                    });
                  }}
                  onMouseMove={(e: ReactMouseEvent<SVGPathElement>) =>
                    emitCountryHover({
                      name: name.length ? name : "Unknown territory",
                      clientX: e.clientX,
                      clientY: e.clientY,
                    })
                  }
                  onMouseLeave={() => emitCountryHover(null)}
                  style={{
                    default: {
                      fill: base,
                      outline: "none",
                    },
                    hover: {
                      fill: hover,
                      outline: "none",
                    },
                    pressed: {
                      fill: base,
                      outline: "none",
                    },
                  }}
                />
              );
            })}
            {borders && (
              <path
                d={borders.svgPath}
                fill="none"
                stroke={COLOR_BORDER_STANDARD}
                strokeWidth={Math.max(0.35, 0.0011 * Math.min(width, height))}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
            {saudiOutline?.svgPath ? (
              <path
                d={saudiOutline.svgPath}
                fill="none"
                stroke={COLOR_BORDER_SAUDI}
                strokeWidth={Math.max(0.9, 0.0029 * Math.min(width, height))}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            ) : null}
          </>
        );
      }}
    </Geographies>
  );
});
GeoPath.displayName = "GeoPath";

/** Premium gold beacon — halo, pulsed outer ring, mid-gold disc, bright core, optional sonar pings. */
const OrderBeacon = memo(function OrderBeacon(props: {
  coordinates: [number, number];
  coreR: number;
  pulse: boolean;
  haloBlurId: string;
  beaconGlowDefId: string;
  labelAr: string;
  onHover: (on: boolean, clientX?: number, clientY?: number) => void;
}) {
  const { coordinates, coreR, pulse, haloBlurId, beaconGlowDefId, onHover, labelAr } = props;
  const reduced = useReducedMotion();

  const hitR = Math.max(coreR * 7.6, 34);
  /** Label sits above the beacon (negative Y in map marker space). */
  const labelYOffset = -(coreR * 5.4 + 26);

  const sonar = pulse && !reduced;

  return (
    <Marker
      coordinates={coordinates}
      onMouseEnter={(e: ReactMouseEvent<SVGGElement> | ReactTouchEvent<SVGGElement>) => {
        const ne = e.nativeEvent;
        const cx = "clientX" in ne ? ne.clientX : undefined;
        const cy = "clientY" in ne ? ne.clientY : undefined;
        onHover(true, cx, cy);
      }}
      onMouseLeave={() => onHover(false)}
      onBlur={() => onHover(false)}
    >
      <g style={{ pointerEvents: "none" }}>
        <circle
          cx={0}
          cy={0}
          r={coreR * 5}
          fill={`url(#${beaconGlowDefId})`}
          filter={`url(#${haloBlurId})`}
          opacity={0.95}
        />

        {!reduced ? (
          <motion.circle
            cx={0}
            cy={0}
            fill="none"
            stroke={GOLD}
            strokeWidth={Math.max(1, coreR * 0.18)}
            initial={false}
            animate={{
              r: [coreR * 3.05, coreR * 3.75, coreR * 3.05],
              strokeOpacity: [0.22, 0.44, 0.22],
            }}
            transition={{
              duration: 2.65,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <circle
            cx={0}
            cy={0}
            r={coreR * 3.35}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.38}
            strokeWidth={Math.max(1, coreR * 0.16)}
          />
        )}

        <circle cx={0} cy={0} r={coreR * 1.38} fill={GOLD} fillOpacity={0.6} />

        <circle cx={0} cy={0} r={Math.max(1.85, coreR * 0.48)} fill={GOLD} />

        {sonar ? (
          <>
            <motion.circle
              cx={0}
              cy={0}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.15}
              strokeOpacity={0.55}
              initial={{ r: coreR * 1.4, opacity: 0.82 }}
              animate={{ r: coreR * 9.2, opacity: 0 }}
              transition={{ duration: 1.75, ease: [0.22, 1, 0.36, 1], repeat: 3, repeatDelay: 0.02 }}
            />
            <motion.circle
              cx={0}
              cy={0}
              fill="none"
              stroke={GOLD}
              strokeWidth={0.85}
              strokeOpacity={0.45}
              initial={{ r: coreR * 1.2, opacity: 0.72 }}
              animate={{ r: coreR * 7.8, opacity: 0 }}
              transition={{
                duration: 1.65,
                ease: [0.22, 1, 0.36, 1],
                repeat: 3,
                repeatDelay: 0.12,
              }}
            />
          </>
        ) : null}

        <g
          transform={`translate(0, ${labelYOffset})`}
          style={{
            fontFamily: "var(--font-naskh, 'Noto Naskh Arabic'), Tahoma, 'Segoe UI', sans-serif",
          }}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontSize={Math.min(12, 9.2 + coreR * 0.45)}
            fill="rgba(255,255,255,0.96)"
            stroke="rgba(6,10,18,0.88)"
            strokeWidth={2.4}
            strokeLinejoin="round"
            style={{ paintOrder: "stroke fill", direction: "rtl", unicodeBidi: "plaintext" }}
            dominantBaseline="middle"
          >
            {labelAr}
          </text>
        </g>
      </g>
      {/* Top hit layer so lens / halos underneath still receive hover */}
      <circle
        cx={0}
        cy={0}
        r={hitR}
        fill="transparent"
        stroke="none"
        style={{ pointerEvents: "all", cursor: "pointer" }}
      />
    </Marker>
  );
});
OrderBeacon.displayName = "OrderBeacon";

type MapMoveEndPayload = { coordinates: number[]; zoom: number };

type ZoomableGroupMoveEndPayload = { coordinates: [number, number]; zoom: number };

export default function LiveOrdersMap({
  orders,
  pulseOrderFingerprints,
}: LiveOrdersMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^\w]/g, "");
  const gid = uid.length ? `siwaky-live-${uid}` : `siwaky-live`;
  const haloBlurId = `${gid}-haloBlur`;
  const beaconGlowDefId = `${gid}-beaconGlow`;

  const [dimensions, setDimensions] = useState({ w: 800, h: 460 });

  const [mapCenter, setMapCenter] = useState<[number, number]>(GCC_DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(GCC_DEFAULT_ZOOM);

  const [countryHover, setCountryHover] = useState<null | {
    name: string;
    cx: number;
    cy: number;
  }>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr?.width) return;
      const w = Math.floor(Math.max(260, cr.width));
      const h = Math.round(w * 0.545);
      setDimensions({ w, h });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const emitCountryHover = useCallback<CountryHoverEmit>((payload) => {
    if (!payload) {
      setCountryHover(null);
      return;
    }
    setCountryHover({ name: payload.name, cx: payload.clientX, cy: payload.clientY });
  }, []);

  const clusters = useMemo(
    () => aggregateByCity(orders, pulseOrderFingerprints),
    [orders, pulseOrderFingerprints],
  );

  const clusterList = useMemo(
    () => [...clusters.values()].sort((a, b) => b.totalSar - a.totalSar),
    [clusters],
  );

  const maxOrders = useMemo(
    () => clusterList.reduce((m, c) => Math.max(m, c.orderCount), 0),
    [clusterList],
  );

  const ribbon = useMemo(() => latestOrders(orders, 45), [orders]);

  const [cityTooltip, setCityTooltip] = useState<{
    slug: CitySlug;
    cx: number;
    cy: number;
  } | null>(null);

  const cityTooltipContent = useMemo(() => {
    if (!cityTooltip) return null;
    const c = clusters.get(cityTooltip.slug);
    if (!c) return null;
    const ar = CITY_COORDS[cityTooltip.slug].labelAr;
    const n = c.orderCount;
    const ordersLine = `${n}\u202F\u200F${n === 1 ? "طلب" : "طلبات"}`;
    return {
      lines: [ar, ordersLine, `المجموع ${formatSar(c.totalSar)} SAR`] as string[],
    };
  }, [clusters, cityTooltip]);

  const projectionConfig = useMemo(
    () => ({
      rotate: [-8, 0, 0] as [number, number, number],
      center: [GCC_DEFAULT_CENTER[0], GCC_DEFAULT_CENTER[1]] as [number, number],
      scale: Math.round(Math.max(420, dimensions.w * 0.988)),
    }),
    [dimensions.w],
  );

  const ribbonText = ribbon
    .map((o) => {
      const name = (o.name ?? "").trim() || "Customer";
      const prod = ((o.product ?? "").trim() || "Order").slice(0, 40);
      const city = CITY_COORDS[resolveCitySlug(o)]?.label ?? "Riyadh";
      const price = formatSar(lineRevenue(o));
      return `${name} · ${prod} · ${price} · ${city}`;
    })
    .filter(Boolean);

  const ribbonJoined =
    ribbonText.length > 0
      ? [...ribbonText, ...ribbonText]
      : [
          "No recent orders yet — listening for live sales…",
          "No recent orders yet — listening for live sales…",
        ];

  useEffect(() => {
    function hide() {
      setCityTooltip(null);
      setCountryHover(null);
    }
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, []);

  const onHoverSlug = useCallback((slug: CitySlug, hover: boolean, cx?: number, cy?: number) => {
    if (!hover || cx == null || cy == null) {
      setCityTooltip(null);
      return;
    }
    setCountryHover(null);
    setCityTooltip({ slug, cx, cy });
  }, []);

  const handleZoomEndPayload = useCallback((payload: MapMoveEndPayload) => {
    setMapZoom(payload.zoom);
    const [lon, lat] = payload.coordinates;
    if (lon != null && lat != null) setMapCenter([lon, lat]);
  }, []);

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  const bumpZoomIn = () => setMapZoom((z) => clampZoom(z * ZOOM_STEP));

  const bumpZoomOut = () => setMapZoom((z) => clampZoom(z / ZOOM_STEP));

  const resetView = () => {
    setMapCenter(GCC_DEFAULT_CENTER);
    setMapZoom(GCC_DEFAULT_ZOOM);
    setCountryHover(null);
    setCityTooltip(null);
  };

  return (
    <div ref={wrapRef} className="w-full min-w-0 overflow-hidden">
      <style>{`
        @keyframes siwakyLiveRibbonMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .siwaky-live-marquee-inner {
          display: inline-flex;
          gap: 2rem;
          animation: siwakyLiveRibbonMarquee 54s linear infinite;
          padding-right: 2rem;
        }
        .siwaky-live-marquee-inner:hover {
          animation-play-state: paused;
        }
        /* No CSS transitions on ZoomableGroup — avoids fighting d3-zoom (wheel centered on cursor, smooth pan). */
        @media (prefers-reduced-motion: reduce) {
          .siwaky-live-marquee-inner {
            animation: none;
            transform: none;
          }
        }
      `}</style>

      <div className="mb-3 flex min-h-[52px] items-center gap-4 rounded-xl border border-white/[0.08] bg-black/52 px-4 py-2.5 shadow-inner backdrop-blur-md sm:gap-6 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/90 opacity-80 motion-safe:animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
          </span>
          <span className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-200/92">
            Live
          </span>
        </div>
        <div className="h-6 w-px shrink-0 bg-white/[0.08]" aria-hidden />
        <p className="font-dashSans text-[13px] text-white/[0.76] tabular-nums">
          Total orders:&nbsp;
          <span className="font-semibold text-white">{orders.length}</span>
        </p>
        <p className="ml-auto hidden font-dashSans text-[11px] text-white/45 sm:block tabular-nums">
          Cities active:&nbsp;<span className="text-[#ebe2c9]/88">{clusters.size}</span>
        </p>
      </div>

      <div
        className="relative isolate overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_rgba(201,169,98,0.14),0_28px_80px_-38px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.06]"
        style={{ borderColor: FRAME_GOLD }}
      >
        {cityTooltipContent && cityTooltip ? (
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[3200] max-w-[280px] rounded-xl border border-[#c9a84c]/48 bg-[#05070e]/96 px-3.5 py-2.5 shadow-xl backdrop-blur-lg"
            dir="rtl"
            style={{
              fontFamily: "var(--font-naskh, 'Noto Naskh Arabic'), system-ui, sans-serif",
              left: Math.min(
                Math.max(cityTooltip.cx + 14, 12),
                typeof window !== "undefined" ? window.innerWidth - 272 : cityTooltip.cx,
              ),
              top: cityTooltip.cy + 14,
            }}
          >
            {cityTooltipContent.lines.map((line, i) => (
              <p
                key={i}
                className={`text-[13px] leading-relaxed ${i === 0 ? "font-semibold text-white" : "text-white/[0.78]"}`}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {countryHover && !cityTooltip ? (
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[3180] max-w-[220px] rounded-lg border border-[#c9a84c]/40 bg-[#05070e]/93 px-3 py-2 shadow-lg backdrop-blur-md"
            style={{
              left: Math.min(
                Math.max(countryHover.cx + 14, 10),
                typeof window !== "undefined" ? window.innerWidth - 240 : countryHover.cx,
              ),
              top: countryHover.cy + 12,
            }}
          >
            <p className="font-dashSans text-[11.5px] font-medium leading-snug text-white/92">
              {countryHover.name}
            </p>
          </div>
        ) : null}

        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={projectionConfig}
            width={dimensions.w}
            height={dimensions.h}
            className="block !max-w-none w-full [&_.rsm-svg]:block [&_.rsm-svg]:h-auto [&_.rsm-svg]:max-h-[min(92vh,720px)] [&_.rsm-svg]:w-full"
            style={{
              background: COLOR_OCEAN,
            }}
          >
            <defs>
              <radialGradient id={beaconGlowDefId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.72} />
                <stop offset="52%" stopColor={GOLD} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </radialGradient>
              <filter id={haloBlurId} x="-160%" y="-160%" width="420%" height="420%">
                <feGaussianBlur stdDeviation={5.6} result="blurHalo" />
                <feMerge>
                  <feMergeNode in="blurHalo" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <ZoomableGroup
              center={mapCenter}
              zoom={mapZoom}
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              className="siwaky-zoom-plane"
              filterZoomEvent={(ev: unknown) => {
                if (!(ev instanceof Event)) return false;
                const t = ev.type;
                if (t === "wheel" || t === "dblclick") return true;
                if (t === "touchstart" || t === "touchmove") return true;
                if (t === "mousedown" && ev instanceof MouseEvent) {
                  return ev.button === 0;
                }
                return true;
              }}
              onMoveStart={() => {
                setCityTooltip(null);
                setCountryHover(null);
              }}
              onMoveEnd={(payload: ZoomableGroupMoveEndPayload) => {
                handleZoomEndPayload(payload);
              }}
            >
              <Sphere
                id={`${gid}-sphere`}
                fill={COLOR_OCEAN}
                stroke="rgba(201,169,98,0.12)"
                strokeWidth={0.45}
              />
              <GeoPath width={dimensions.w} height={dimensions.h} emitCountryHover={emitCountryHover} />
              {clusterList.map((c) => (
                <OrderBeacon
                  key={c.slug}
                  haloBlurId={haloBlurId}
                  beaconGlowDefId={beaconGlowDefId}
                  coordinates={[c.lng, c.lat]}
                  coreR={beaconCoreRadiusPx(c.orderCount, maxOrders)}
                  pulse={c.pulse}
                  labelAr={CITY_COORDS[c.slug].labelAr}
                  onHover={(hover, cx, cy) => onHoverSlug(c.slug, hover, cx, cy)}
                />
              ))}
            </ZoomableGroup>
          </ComposableMap>

          <div
            className="pointer-events-none absolute inset-0 z-[6] rounded-t-2xl"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 84% 76% at 50% 40%, transparent 48%, rgba(2, 4, 10, 0.82) 100%), linear-gradient(180deg, rgba(4,8,18,0.62) 0%, transparent 20%, transparent 80%, rgba(4,8,18,0.58) 100%)",
              mixBlendMode: "multiply",
            }}
          />

          <div className="pointer-events-none absolute inset-0 z-[7] rounded-t-2xl ring-1 ring-inset ring-[rgba(201,168,76,0.32)]" aria-hidden />

          <div className="pointer-events-none absolute right-3 top-3 z-[22] flex flex-col items-end gap-1.5 sm:right-4 sm:top-4">
            <div className="pointer-events-auto flex flex-col overflow-hidden rounded-lg border border-[rgba(201,168,76,0.38)] bg-[#05070e]/88 shadow-lg backdrop-blur-md">
              <button
                type="button"
                aria-label="Zoom in"
                className="flex h-9 w-9 items-center justify-center font-dashSans text-[18px] font-semibold text-[#f3e7c8] transition hover:bg-white/[0.06] active:bg-white/[0.12]"
                onClick={(e) => {
                  e.stopPropagation();
                  bumpZoomIn();
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                +
              </button>
              <span className="mx-2 h-px bg-[rgba(201,168,76,0.22)]" aria-hidden />
              <button
                type="button"
                aria-label="Zoom out"
                className="flex h-9 w-9 items-center justify-center font-dashSans text-[18px] font-semibold text-[#f3e7c8] transition hover:bg-white/[0.06] active:bg-white/[0.12]"
                onClick={(e) => {
                  e.stopPropagation();
                  bumpZoomOut();
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                −
              </button>
            </div>
            <button
              type="button"
              className="pointer-events-auto rounded-lg border border-[rgba(201,168,76,0.38)] bg-[#05070e]/88 px-2.5 py-1.5 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0e3c2] shadow-md backdrop-blur-md transition hover:bg-white/[0.06] active:bg-white/[0.12] sm:px-3"
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              Reset view
            </button>
          </div>
        </div>

        <div className="relative border-t border-[rgba(201,168,76,0.18)] bg-[#03050d] bg-gradient-to-b from-[#040711] via-[#03050d] to-[#020408]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
          <p className="px-4 pb-2 pt-3 font-dashSans text-[9px] font-semibold uppercase tracking-[0.28em] text-[#c9a84c]/82">
            Latest orders
          </p>
          <div className="relative overflow-hidden pb-4">
            <div className="siwaky-live-marquee-inner whitespace-nowrap pr-24">
              {ribbonJoined.map((line, idx) => (
                <span
                  key={`${idx}-${line.slice(0, 24)}`}
                  className="inline-block font-dashSans text-[11px] text-white/[0.78]"
                >
                  {line}
                  &nbsp;<span className="text-[#c9a84c]/88" aria-hidden>
                    ◆
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
