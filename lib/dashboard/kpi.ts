import type { OrderRow } from "@/lib/dashboard/types";

export function sheetCellTruthy(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return false;
  if (v === "true" || v === "yes" || v === "1" || v === "y") return true;
  if (/^(✓|✅|☑|✔)/u.test(v.trim())) return true;
  return false;
}

function parseNumberLoose(raw: string): number {
  const s = raw.replace(/[\s,]/g, "").replace(/[^\d.-]/g, "");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function lineRevenue(order: OrderRow): number {
  const qty = Math.max(0, parseNumberLoose(order.quantity));
  const price = Math.max(0, parseNumberLoose(order.price_sar));
  return qty * price;
}

export type OrderKpis = {
  totalOrders: number;
  deliveredCount: number;
  returnedCount: number;
  totalRevenue: number;
};

export function computeOrderKpis(orders: OrderRow[]): OrderKpis {
  let deliveredCount = 0;
  let returnedCount = 0;
  let totalRevenue = 0;

  for (const o of orders) {
    if (sheetCellTruthy(o.delivered)) deliveredCount += 1;
    if (sheetCellTruthy(o.returned)) returnedCount += 1;
    totalRevenue += lineRevenue(o);
  }

  return {
    totalOrders: orders.length,
    deliveredCount,
    returnedCount,
    totalRevenue,
  };
}

export function latestOrders(orders: OrderRow[], limit = 40): OrderRow[] {
  if (limit <= 0) return [...orders];
  return [...orders].reverse().slice(0, limit);
}

export function statusAccent(order: OrderRow): {
  label: string;
  ringClass: string;
  dotClass: string;
  textClass: string;
} {
  const s = (order.status ?? "").trim().toLowerCase();
  const delivered = sheetCellTruthy(order.delivered);
  const returned = sheetCellTruthy(order.returned);

  if (returned) {
    return {
      label: order.status?.trim() || "Returned",
      ringClass: "ring-rose-500/35",
      dotClass: "bg-rose-400",
      textClass: "text-rose-100/90",
    };
  }
  if (delivered || s.includes("deliver")) {
    return {
      label: order.status?.trim() || "Delivered",
      ringClass: "ring-emerald-500/35",
      dotClass: "bg-emerald-400",
      textClass: "text-emerald-100/90",
    };
  }
  if (s.includes("ship") || s.includes("transit") || s.includes("way")) {
    return {
      label: order.status?.trim() || "In transit",
      ringClass: "ring-sky-500/35",
      dotClass: "bg-sky-400",
      textClass: "text-sky-100/90",
    };
  }
  if (s.includes("pend") || s.includes("new") || s.includes("process")) {
    return {
      label: order.status?.trim() || "Processing",
      ringClass: "ring-amber-500/35",
      dotClass: "bg-amber-400",
      textClass: "text-amber-100/90",
    };
  }
  return {
    label: order.status?.trim() || "—",
    ringClass: "ring-white/10",
    dotClass: "bg-white/35",
    textClass: "text-white/85",
  };
}

export function formatSar(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString("en-US")} SAR`;
  }
}
