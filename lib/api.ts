import axios, { AxiosError } from "axios";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.siwaky.com";

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

export interface GeoCheckResponse {
  allowed: boolean;
  country?: string;
  reason?:
    | "not_ksa"
    | "vpn"
    | "anonymous_proxy"
    | "high_risk"
    | "error"
    | null;
  ip?: string;
  risk_score?: number;
}

export interface OrderCreateInput {
  name: string;
  phone: string;
  offer: "box-1" | "box-2" | "box-3";
  quantity: number;
  price_sar: number;
  source?: string;
  campaign?: string;
  event_id?: string;
}

export interface OrderCreateResponse {
  order_id: string;
  status: string;
  price_sar: number;
  event_id?: string;
}

export async function geoCheck() {
  const { data } = await api.get<GeoCheckResponse>("/api/geo/check");
  return data;
}

export async function createOrder(input: OrderCreateInput) {
  try {
    const { data } = await api.post<OrderCreateResponse>("/api/orders", input);
    return { ok: true as const, data };
  } catch (err) {
    const e = err as AxiosError<{ error?: string; detail?: string }>;
    const code =
      (e.response?.data as { error?: string } | undefined)?.error ??
      (e.response?.status === 403 ? "geo_blocked" : "server_error");
    return { ok: false as const, code, status: e.response?.status ?? 0 };
  }
}
