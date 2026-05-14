import {
  computeOrderKpis,
  formatSar,
  lineRevenue,
  sheetCellTruthy,
  statusAccent,
  type OrderKpis,
} from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

const BUCKET_COUNT = 12;
const ANALYTICS_TAIL = 420;

export type RevenueBucket = {
  id: string;
  label: string;
  revenue: number;
  orders: number;
  rowSpan: string;
};

export type RankedCity = {
  city: string;
  count: number;
  pct: number;
};

export type RankedProduct = {
  product: string;
  count: number;
  revenue: number;
  pctOrders: number;
  pctRevenue: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  amount: string;
  dotClass: string;
  ringClass: string;
  textClass: string;
};

export type DashboardAnalytics = {
  kpis: OrderKpis;
  confirmationRatePct: number | null;
  deliveryRatePct: number | null;
  avgOrderValue: number;
  returnRatePct: number | null;
  revenueBuckets: RevenueBucket[];
  cities: RankedCity[];
  products: RankedProduct[];
  activity: ActivityItem[];
};

function bucketSheetRows(orders: OrderRow[]): RevenueBucket[] {
  const n = orders.length;
  if (n === 0) return [];

  const offset = Math.max(0, n - ANALYTICS_TAIL);
  const tail = orders.slice(offset);
  const len = tail.length;
  const size = Math.max(1, Math.ceil(len / BUCKET_COUNT));

  const buckets: RevenueBucket[] = [];
  let bIdx = 0;
  for (let b = 0; b < BUCKET_COUNT; b++) {
    const start = b * size;
    if (start >= len) break;
    const slice = tail.slice(start, start + size);
    let revenue = 0;
    for (const o of slice) revenue += lineRevenue(o);

    const rowLo = offset + start + 1;
    const rowHi = offset + start + slice.length;
    buckets.push({
      id: `b${bIdx++}`,
      label: `${b}`,
      revenue,
      orders: slice.length,
      rowSpan:
        slice.length === 0 ? "—" : rowLo <= rowHi ? `Rows ~${rowLo}–${rowHi}` : `${slice.length} rows`,
    });
  }

  return buckets.map((buck, idx, arr) => ({
    ...buck,
    label: idx === 0 ? "Start" : idx === arr.length - 1 ? "Latest" : `${idx}`,
  }));
}

function rankCities(orders: OrderRow[]): RankedCity[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const raw = (o.city ?? "").trim();
    const k = raw || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const total = orders.length || 1;
  const list = [...map.entries()]
    .map(([city, count]) => ({
      city,
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return list;
}

function rankProducts(orders: OrderRow[]): RankedProduct[] {
  const map = new Map<string, { count: number; revenue: number }>();
  let totalOrders = orders.length || 1;
  let revenueAll = 0;
  for (const o of orders) {
    const raw = (o.product ?? "").trim();
    const k = raw || "Unlabeled";
    const prev = map.get(k) ?? { count: 0, revenue: 0 };
    const rev = lineRevenue(o);
    prev.count += 1;
    prev.revenue += rev;
    map.set(k, prev);
    revenueAll += rev;
  }
  const denomRev = revenueAll || 1;
  const list = [...map.entries()]
    .map(([product, { count, revenue }]) => ({
      product,
      count,
      revenue,
      pctOrders: Math.round((count / totalOrders) * 1000) / 10,
      pctRevenue: Math.round((revenue / denomRev) * 1000) / 10,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  return list;
}

function buildActivity(orders: OrderRow[]): ActivityItem[] {
  const reversed = [...orders].reverse().slice(0, 22);
  return reversed.map((o, idx) => {
    const accent = statusAccent(o);
    const titleParts = [o.product?.trim(), o.qty?.trim() ? `×${o.qty.trim()}` : ""].filter(Boolean);
    const sub = [
      o.name?.trim(),
      [o.city?.trim(), o.country?.trim()].filter(Boolean).join(", "),
    ].filter(Boolean);
    return {
      id: `act-${idx}-${o.phone ?? ""}-${o.product ?? ""}`,
      title: titleParts.length ? titleParts.join(" ") : "Order snapshot",
      subtitle: sub.join(" · ") || "—",
      badge: accent.label,
      amount: formatSar(lineRevenue(o)),
      dotClass: accent.dotClass,
      ringClass: accent.ringClass,
      textClass: accent.textClass,
    };
  });
}

export function buildDashboardAnalytics(orders: OrderRow[]): DashboardAnalytics {
  const kpis = computeOrderKpis(orders);

  let confirmedCount = 0;
  for (const o of orders) {
    if (sheetCellTruthy(o.confirmed)) confirmedCount += 1;
  }

  const total = kpis.totalOrders;
  const confirmationRatePct =
    total === 0 ? null : Math.round((confirmedCount / total) * 1000) / 10;
  const deliveryRatePct =
    total === 0 ? null : Math.round((kpis.deliveredCount / total) * 1000) / 10;
  const returnRatePct =
    total === 0 ? null : Math.round((kpis.returnedCount / total) * 1000) / 10;
  const avgOrderValue =
    total === 0 ? 0 : Math.round((kpis.totalRevenue / total) * 100) / 100;

  return {
    kpis,
    confirmationRatePct,
    deliveryRatePct,
    avgOrderValue,
    returnRatePct,
    revenueBuckets: bucketSheetRows(orders),
    cities: rankCities(orders),
    products: rankProducts(orders),
    activity: buildActivity(orders),
  };
}
