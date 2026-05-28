"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

import { lineRevenue } from "@/lib/dashboard/kpi";
import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

// ── Constants ────────────────────────────────────────────────────────────────

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const OCEAN          = "#1a1a2e";
const COUNTRY_DEFAULT = "#2d2d3d";
const COUNTRY_SAUDI   = "#1e3a2f";
const COUNTRY_GCC     = "#252540";
const BORDER          = "rgba(201,168,76,0.2)";
const GOLD            = "#C9A84C";

const GCC_ISOS = new Set(["ARE", "KWT", "QAT", "BHR", "OMN"]);

const DEFAULT_CENTER: [number, number] = [46, 24];
const DEFAULT_ZOOM = 3.5;
const ZOOM_MIN  = 1;
const ZOOM_MAX  = 8;
const ZOOM_STEP = 1.35;

// ── City coordinates (hardcoded as specified) ─────────────────────────────

const CITIES: Record<string, [number, number]> = {
  "الرياض":  [46.6753, 24.7136],
  "جدة":     [39.1925, 21.4858],
  "الدمام":  [50.0888, 26.4207],
  "مكة":     [39.8579, 21.3891],
  "المدينة": [39.5692, 24.5247],
  "دبي":     [55.2708, 25.2048],
  "الكويت":  [47.9774, 29.3759],
  "الدوحة":  [51.5310, 25.2854],
  "أبوظبي":  [54.3773, 24.4539],
  "مسقط":    [58.5922, 23.5880],
};

/** Arabic & English → CITIES key */
const CITY_LOOKUP: Record<string, string> = {
  // Arabic variants
  "الرياض": "الرياض", "الدمام": "الدمام", "جدة": "جدة",
  "مكة": "مكة", "مكة المكرمة": "مكة",
  "المدينة": "المدينة", "المدينة المنورة": "المدينة",
  "دبي": "دبي", "الكويت": "الكويت", "مدينة الكويت": "الكويت",
  "الدوحة": "الدوحة", "أبوظبي": "أبوظبي", "أبو ظبي": "أبوظبي",
  "مسقط": "مسقط",
  // English (lowercase matched below)
  "riyadh": "الرياض", "arriyadh": "الرياض", "riyad": "الرياض",
  "jeddah": "جدة", "jidda": "جدة", "jedda": "جدة",
  "dammam": "الدمام", "dhahran": "الدمام", "khobar": "الدمام",
  "al khobar": "الدمام", "alkhobar": "الدمام",
  "makkah": "مكة", "mecca": "مكة", "makkah almukarramah": "مكة",
  "madinah": "المدينة", "medina": "المدينة", "al madinah": "المدينة",
  "dubai": "دبي", "dubayy": "دبي",
  "kuwait": "الكويت", "kuwait city": "الكويت", "kuwaitcity": "الكويت",
  "doha": "الدوحة", "ad dawhah": "الدوحة",
  "abu dhabi": "أبوظبي", "abudhabi": "أبوظبي", "abu zabi": "أبوظبي",
  "muscat": "مسقط", "masqat": "مسقط",
};

function resolveCity(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (CITIES[s]) return s;
  const lower = s.toLowerCase();
  return CITY_LOOKUP[s] ?? CITY_LOOKUP[lower] ?? null;
}

// ── Geo helpers ───────────────────────────────────────────────────────────

type GeoProps = Record<string, unknown>;
type RawGeo   = { properties?: GeoProps; rsmKey?: string };

function getIso3(p: GeoProps | undefined): string | null {
  if (!p) return null;
  const raw = String(p.ISO_A3 ?? p.iso_a3 ?? "");
  const t   = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(t) ? t : null;
}

function countryFill(p: GeoProps | undefined): string {
  const iso = getIso3(p);
  if (iso === "SAU") return COUNTRY_SAUDI;
  if (iso && GCC_ISOS.has(iso)) return COUNTRY_GCC;
  return COUNTRY_DEFAULT;
}

function lighten(hex: string, amt = 20): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >>  8) & 255) + amt);
  const b = Math.min(255, ( n        & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

function filterAntarctica(feats: RawGeo[]): RawGeo[] {
  return feats.filter((g) => {
    if (getIso3(g.properties) === "ATA") return false;
    return String(g.properties?.NAME ?? "").toLowerCase().trim() !== "antarctica";
  });
}

// ── Data aggregation ──────────────────────────────────────────────────────

type CityData = {
  key: string;
  coords: [number, number];
  count: number;
  sar: number;
  isBurst: boolean;
};

function aggregateCities(orders: OrderRow[], pulseSet: ReadonlySet<string>): CityData[] {
  const map = new Map<string, { count: number; sar: number; burst: boolean }>();
  for (const order of orders) {
    const key = resolveCity(order.city);
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, sar: 0, burst: false };
    cur.count++;
    cur.sar += lineRevenue(order);
    if (!cur.burst && pulseSet.has(stableOrderFingerprint(order))) cur.burst = true;
    map.set(key, cur);
  }
  return [...map.entries()]
    .filter(([, v]) => v.count > 0)
    .map(([key, v]) => ({
      key,
      coords: CITIES[key] as [number, number],
      count: v.count,
      sar: v.sar,
      isBurst: v.burst,
    }));
}

function dotRadius(count: number): number {
  if (count <= 2) return 4;
  if (count <= 5) return 5.5;
  return 7;
}

// ── CityDot ───────────────────────────────────────────────────────────────

const CityDot = memo(function CityDot({
  cityKey,
  coords,
  count,
  isBurst,
  burstVersion,
}: {
  cityKey: string;
  coords: [number, number];
  count: number;
  isBurst: boolean;
  burstVersion: number;
}) {
  const r = dotRadius(count);
  return (
    <Marker coordinates={coords}>
      <g style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.8))" }}>
        {/* Burst ring — key remount retriggers animation */}
        {isBurst && (
          <circle
            key={burstVersion}
            r={r}
            fill={GOLD}
            fillOpacity={0.7}
            className="siwaky-burst"
          />
        )}
        {/* Steady pulse dot */}
        <circle r={r} fill={GOLD} className="siwaky-pulse" />
        {/* City label — right of dot */}
        <text
          x={r + 5}
          y={0}
          fontSize={10}
          fill="white"
          dominantBaseline="middle"
          style={{
            pointerEvents: "none",
            fontFamily: "system-ui, Tahoma, sans-serif",
            userSelect: "none",
          }}
        >
          {cityKey}
        </text>
      </g>
    </Marker>
  );
});
CityDot.displayName = "CityDot";

// ── Inline button styles ──────────────────────────────────────────────────

const ZOOM_BTN: React.CSSProperties = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 600,
  color: "#f3e7c8",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1,
};

const RESET_BTN: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid rgba(201,168,76,0.45)`,
  background: "rgba(5,7,14,0.88)",
  backdropFilter: "blur(8px)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#f0e3c2",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};

// ── Types ─────────────────────────────────────────────────────────────────

type ZoomPayload = { coordinates: [number, number]; zoom: number };

type GeosRender = {
  geographies: (RawGeo & { rsmKey: string })[];
  borders?: { svgPath: string };
};

export type LiveOrdersMapProps = {
  orders: OrderRow[];
  pulseOrderFingerprints: Set<string>;
};

// ── Main component ────────────────────────────────────────────────────────

const LiveOrdersMap = memo(function LiveOrdersMap({
  orders,
  pulseOrderFingerprints,
}: LiveOrdersMapProps) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom]     = useState(DEFAULT_ZOOM);

  // Per-city burst version — bumping triggers a key change that remounts the burst circle
  const [burstVersions, setBurstVersions] = useState<Record<string, number>>({});
  const prevBurstKeysRef = useRef<Set<string>>(new Set());

  const cities = useMemo(
    () => aggregateCities(orders, pulseOrderFingerprints),
    [orders, pulseOrderFingerprints],
  );

  useEffect(() => {
    const nowBurst = new Set(cities.filter((c) => c.isBurst).map((c) => c.key));
    const newly    = [...nowBurst].filter((k) => !prevBurstKeysRef.current.has(k));
    prevBurstKeysRef.current = nowBurst;
    if (!newly.length) return;
    setBurstVersions((prev) => {
      const next = { ...prev };
      for (const k of newly) next[k] = (next[k] ?? 0) + 1;
      return next;
    });
  }, [cities]);

  // Last 5 orders for ribbon
  const ribbonLines = useMemo(() => {
    const last5 = [...orders].reverse().slice(0, 5);
    const items  = last5.map((o) => {
      const name = (o.name ?? "").trim() || "عميل";
      const city = (o.city ?? "").trim() || "—";
      const sar  = Math.round(lineRevenue(o));
      return `${name} · ${city} · SAR ${sar}`;
    });
    if (!items.length) return ["لا يوجد طلبات بعد…", "لا يوجد طلبات بعد…"];
    return [...items, ...items]; // duplicate for seamless loop
  }, [orders]);

  const handleMoveEnd = useCallback((p: ZoomPayload) => {
    setCenter(p.coordinates);
    setZoom(p.zoom);
  }, []);

  const clamp   = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  const zoomIn  = () => setZoom((z) => clamp(z * ZOOM_STEP));
  const zoomOut = () => setZoom((z) => clamp(z / ZOOM_STEP));
  const reset   = () => { setCenter(DEFAULT_CENTER); setZoom(DEFAULT_ZOOM); };

  return (
    <div style={{ width: "100%" }}>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes siwakyPulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.5); opacity: 0.3; }
        }
        @keyframes siwakyBurst {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        @keyframes siwakyRibbon {
          0%   { transform: translateX(0);    }
          100% { transform: translateX(-50%); }
        }
        @keyframes siwakyPing {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .siwaky-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: siwakyPulse 2s ease-in-out infinite;
        }
        .siwaky-burst {
          transform-box: fill-box;
          transform-origin: center;
          animation: siwakyBurst 0.6s ease-out forwards;
        }
        .siwaky-ribbon {
          display: inline-flex;
          gap: 2rem;
          white-space: nowrap;
          animation: siwakyRibbon 36s linear infinite;
        }
        .siwaky-ribbon:hover { animation-play-state: paused; }
        .siwaky-live-ping { animation: siwakyPing 1s cubic-bezier(0,0,0.2,1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .siwaky-pulse, .siwaky-burst, .siwaky-ribbon, .siwaky-live-ping { animation: none; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", marginBottom: 12,
        background: "rgba(0,0,0,0.5)", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
      }}>
        {/* Green live dot */}
        <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
          <span className="siwaky-live-ping" style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "#34d399", opacity: 0.75,
          }} />
          <span style={{
            position: "relative", width: 8, height: 8, borderRadius: "50%",
            background: "#6ee7b7", boxShadow: "0 0 8px rgba(52,211,153,0.6)", flexShrink: 0,
          }} />
        </span>

        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.3em",
          textTransform: "uppercase", color: "#6ee7b7", fontFamily: "system-ui, sans-serif",
        }}>
          LIVE
        </span>

        <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui, sans-serif" }}>
          Total orders:&nbsp;<strong style={{ color: "white" }}>{orders.length}</strong>
        </span>
      </div>

      {/* ── Map card ── */}
      <div style={{
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(201,168,76,0.25)",
        background: OCEAN,
      }}>

        {/* SVG map area */}
        <div
          className="relative h-[300px] md:h-[500px]"
          style={{ background: OCEAN }}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 400 }}
            style={{ width: "100%", height: "100%", display: "block", background: OCEAN }}
          >
            <ZoomableGroup
              center={center}
              zoom={zoom}
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              onMoveEnd={handleMoveEnd}
            >
              <Geographies
                geography={GEO_URL}
                parseGeographies={filterAntarctica as (feats: unknown[]) => unknown[]}
              >
                {({ geographies, borders }: GeosRender) => (
                  <>
                    {geographies.map((geo) => {
                      const base = countryFill(geo.properties);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo as object}
                          style={{
                            default: { fill: base,          outline: "none" },
                            hover:   { fill: lighten(base), outline: "none", cursor: "default" },
                            pressed: { fill: base,          outline: "none" },
                          }}
                        />
                      );
                    })}
                    {borders?.svgPath && (
                      <path
                        d={borders.svgPath}
                        fill="none"
                        stroke={BORDER}
                        strokeWidth={0.5}
                        pointerEvents="none"
                      />
                    )}
                  </>
                )}
              </Geographies>

              {cities.map((c) => (
                <CityDot
                  key={c.key}
                  cityKey={c.key}
                  coords={c.coords}
                  count={c.count}
                  isBurst={c.isBurst}
                  burstVersion={burstVersions[c.key] ?? 0}
                />
              ))}
            </ZoomableGroup>
          </ComposableMap>

          {/* ── Zoom controls ── */}
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{
              display: "flex", flexDirection: "column",
              overflow: "hidden", borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.45)",
              background: "rgba(5,7,14,0.88)",
              backdropFilter: "blur(8px)",
            }}>
              <button
                type="button"
                aria-label="Zoom in"
                style={ZOOM_BTN}
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                +
              </button>
              <span style={{ height: 1, background: "rgba(201,168,76,0.2)", margin: "0 6px" }} />
              <button
                type="button"
                aria-label="Zoom out"
                style={ZOOM_BTN}
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                −
              </button>
            </div>
            <button
              type="button"
              style={RESET_BTN}
              onClick={(e) => { e.stopPropagation(); reset(); }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Bottom order ribbon ── */}
        <div style={{
          borderTop: "1px solid rgba(201,168,76,0.18)",
          background: "#03050d",
          paddingBottom: 12,
        }}>
          <p style={{
            padding: "10px 16px 6px",
            fontSize: 9, fontWeight: 700,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: "rgba(201,168,76,0.8)", fontFamily: "system-ui, sans-serif",
            margin: 0,
          }}>
            Latest orders
          </p>
          <div style={{ overflow: "hidden" }}>
            <div className="siwaky-ribbon">
              {ribbonLines.map((line, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.78)",
                    fontFamily: "system-ui, Tahoma, sans-serif",
                    display: "inline-block",
                  }}
                >
                  {line}&nbsp;
                  <span style={{ color: "rgba(201,168,76,0.88)" }} aria-hidden>◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
LiveOrdersMap.displayName = "LiveOrdersMap";

export default LiveOrdersMap;
