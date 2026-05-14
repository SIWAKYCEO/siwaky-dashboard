/**
 * Approximate coordinates for Live View map (GCC-first).
 * Unknown cities fall back to country centroids inside Gulf bounds.
 */

import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

export type LatLng = { lat: number; lng: number };

const GCC_BOX = {
  south: 15.8,
  north: 32.6,
  west: 34.4,
  east: 59.9,
};

const GCC_COUNTRY: Record<string, LatLng> = {
  SA: { lat: 24.71, lng: 46.67 },
  AE: { lat: 23.42, lng: 53.84 },
  QA: { lat: 25.29, lng: 51.53 },
  KW: { lat: 29.38, lng: 47.97 },
  BH: { lat: 26.07, lng: 50.56 },
  OM: { lat: 21.47, lng: 55.92 },
};

const GCC_CITIES: Record<string, LatLng> = {
  riyadh: { lat: 24.7136, lng: 46.6753 },
  riyad: { lat: 24.7136, lng: 46.6753 },
  arriyadh: { lat: 24.7136, lng: 46.6753 },
  jeddah: { lat: 21.4858, lng: 39.1925 },
  jiddah: { lat: 21.4858, lng: 39.1925 },
  mecca: { lat: 21.3891, lng: 39.8579 },
  makkah: { lat: 21.3891, lng: 39.8579 },
  medina: { lat: 24.5247, lng: 39.5692 },
  madinah: { lat: 24.5247, lng: 39.5692 },
  dammam: { lat: 26.4207, lng: 50.0888 },
  khobar: { lat: 26.2794, lng: 50.208 },
  alkhobar: { lat: 26.2794, lng: 50.208 },
  dhahran: { lat: 26.2881, lng: 50.114 },
  tabuk: { lat: 28.3838, lng: 36.555 },
  abha: { lat: 18.2164, lng: 42.5053 },
  buraidah: { lat: 26.326, lng: 43.975 },
  hail: { lat: 27.5114, lng: 41.69 },
  taif: { lat: 21.2703, lng: 40.4158 },
  "at taif": { lat: 21.2703, lng: 40.4158 },
  najran: { lat: 17.4917, lng: 44.1322 },
  jazan: { lat: 16.8895, lng: 42.551 },
  yanbu: { lat: 24.0892, lng: 38.0618 },
  khamis: { lat: 18.3, lng: 42.733 },
  "khamis mushait": { lat: 18.3, lng: 42.733 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  dubayy: { lat: 25.2048, lng: 55.2708 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  abudhabi: { lat: 24.4539, lng: 54.3773 },
  abu: { lat: 24.4539, lng: 54.3773 },
  sharjah: { lat: 25.3463, lng: 55.4209 },
  ajman: { lat: 25.4052, lng: 55.5136 },
  "al ain": { lat: 24.1302, lng: 55.8023 },
  alain: { lat: 24.1302, lng: 55.8023 },
  "ras al khaimah": { lat: 25.6741, lng: 55.9804 },
  rak: { lat: 25.6741, lng: 55.9804 },
  fujairah: { lat: 25.1288, lng: 56.3264 },
  doha: { lat: 25.2854, lng: 51.531 },
  "al rayyan": { lat: 25.2919, lng: 51.4244 },
  rayyan: { lat: 25.2919, lng: 51.4244 },
  "al wakrah": { lat: 25.1655, lng: 51.5977 },
  kuwait: { lat: 29.3759, lng: 47.9774 },
  "kuwait city": { lat: 29.3759, lng: 47.9774 },
  hawalli: { lat: 29.3328, lng: 48.0286 },
  salmiya: { lat: 29.3342, lng: 48.0733 },
  manama: { lat: 26.2235, lng: 50.5876 },
  riffa: { lat: 26.13, lng: 50.555 },
  muscat: { lat: 23.588, lng: 58.3829 },
  salalah: { lat: 17.0197, lng: 54.0898 },
  sohar: { lat: 24.3475, lng: 56.7098 },
  sur: { lat: 22.5667, lng: 59.5289 },
};

function norm(s: string | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}

function simpleHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function jitterLatLng(seed: string, magLat: number, magLng: number): LatLng {
  const h = simpleHash(seed);
  const dx = ((h % 1000) / 1000 - 0.5) * 2 * magLng;
  const dy = (((h >> 8) % 1000) / 1000 - 0.5) * 2 * magLat;
  return { lat: dy, lng: dx };
}

/** Resolve GCC city coordinates from messy sheet strings (substring + token fallbacks). */
function lookupCityCoords(cityNorm: string): LatLng | null {
  if (!cityNorm) return null;
  if (GCC_CITIES[cityNorm]) return GCC_CITIES[cityNorm];

  for (const [k, v] of Object.entries(GCC_CITIES)) {
    const nk = norm(k);
    if (nk && nk === cityNorm) return v;
  }

  for (const [k, v] of Object.entries(GCC_CITIES)) {
    if (k.length >= 4 && cityNorm.includes(k)) return v;
  }

  const tokens = cityNorm.split(/[\s,/]+/).filter((t) => t.length >= 3);
  for (const token of tokens) {
    if (GCC_CITIES[token]) return GCC_CITIES[token];
    for (const [k, v] of Object.entries(GCC_CITIES)) {
      if (k.length >= 4 && (token.includes(k) || k.includes(token))) return v;
    }
  }

  return null;
}

export type PlacementPrecision = "city" | "country";

function spreadOverlappingMarkers<
  T extends { lat: number; lng: number; id: string },
>(markers: T[]): T[] {
  const bucketCounts = new Map<string, number>();
  return markers.map((m) => {
    const coarseKey = `${m.lat.toFixed(3)}_${m.lng.toFixed(3)}`;
    const n = bucketCounts.get(coarseKey) ?? 0;
    bucketCounts.set(coarseKey, n + 1);
    if (n === 0) return { ...m };
    const angle = (simpleHash(`${m.id}|${n}|spread`) % 3600) * (Math.PI / 1800);
    const radiusDeg = 0.019 * Math.sqrt(n);
    return {
      ...m,
      lat: m.lat + radiusDeg * Math.cos(angle),
      lng: m.lng + radiusDeg * Math.sin(angle),
    };
  });
}

function inferCountryCode(countryRaw: string | undefined): string | null {
  const c = norm(countryRaw);
  if (!c) return null;
  if (/^(sa|ksa|saudi)/.test(c)) return "SA";
  if (/(uae|united arab|emirates)/.test(c) || c === "ae") return "AE";
  if (/qatar|\bqa\b/.test(c)) return "QA";
  if (/kuwait|\bkw\b/.test(c)) return "KW";
  if (/bahrain|\bbh\b/.test(c)) return "BH";
  if (/oman|\bom\b/.test(c)) return "OM";
  return null;
}

function isInGccBox(ll: LatLng): boolean {
  return (
    ll.lat >= GCC_BOX.south &&
    ll.lat <= GCC_BOX.north &&
    ll.lng >= GCC_BOX.west &&
    ll.lng <= GCC_BOX.east
  );
}

export function liveOrderKey(order: OrderRow, indexFromNewest: number): string {
  const basis = [
    indexFromNewest,
    norm(order.phone),
    norm(order.product),
    norm(order.city),
    norm(order.country),
    norm(order.qty),
    norm(order.price_sar),
    norm(order.status),
  ].join("|");
  return `o${simpleHash(basis)}`;
}

export function coordinatesForOrder(
  order: OrderRow,
  indexFromNewest: number,
): { lat: number; lng: number; precision: PlacementPrecision } | null {
  const cityNorm = norm(order.city);
  const cc = inferCountryCode(order.country);
  const fp = stableOrderFingerprint(order);

  let base: LatLng | null = null;
  let precision: PlacementPrecision = "country";

  if (cityNorm) {
    const hit = lookupCityCoords(cityNorm);
    if (hit) {
      base = hit;
      precision = "city";
    }
  }

  if (!base && cc && GCC_COUNTRY[cc]) {
    base = GCC_COUNTRY[cc];
    precision = "country";
  }

  if (!base) return null;

  const seed = `${fp}|${indexFromNewest}`;
  const j =
    precision === "city"
      ? jitterLatLng(seed, 0.024, 0.032)
      : jitterLatLng(seed, 0.08, 0.1);

  const ll = { lat: base.lat + j.lat, lng: base.lng + j.lng };
  if (!isInGccBox(ll)) return null;
  return { ...ll, precision };
}

export function buildLiveMapMarkers(
  ordersNewestFirst: OrderRow[],
  /** Stable fingerprints (`stableOrderFingerprint`) that should briefly pulse */
  pulseFingerprints: Set<string>,
  limit = 60,
): {
  markers: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    subtitle: string;
    pulse: boolean;
    placement: PlacementPrecision;
  }>;
  skippedNonGcc: number;
} {
  let skippedNonGcc = 0;
  const markers: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    subtitle: string;
    pulse: boolean;
    placement: PlacementPrecision;
  }> = [];

  ordersNewestFirst.forEach((o, idx) => {
    if (markers.length >= limit) return;
    const ll = coordinatesForOrder(o, idx);
    if (!ll) {
      skippedNonGcc += 1;
      return;
    }
    const id = `${stableOrderFingerprint(o)}-${idx}`;
    const title = (o.product ?? "").trim() || "Product";
    const subtitle = [
      (o.city ?? "").trim(),
      (o.country ?? "").trim(),
    ]
      .filter(Boolean)
      .join(", ");
    markers.push({
      id,
      lat: ll.lat,
      lng: ll.lng,
      title,
      subtitle: subtitle || "GCC",
      pulse: pulseFingerprints.has(stableOrderFingerprint(o)),
      placement: ll.precision,
    });
  });

  return {
    markers: spreadOverlappingMarkers(markers),
    skippedNonGcc,
  };
}
