import axios, { AxiosError } from "axios";

import { checkoutOrderPostAbsoluteUrl, CHECKOUT_ORDER_POST_PATH } from "@/lib/checkout/order-post-url";

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
  notes?: string;
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

function axiosErrorPayload(err: AxiosError<{ error?: string; detail?: unknown }>, postUrlForLog: string) {
  const data = err.response?.data as { error?: string; detail?: unknown } | undefined;
  let code =
    typeof data?.error === "string"
      ? data.error
      : typeof data?.detail === "object" &&
          data.detail !== null &&
          "error" in data.detail &&
          typeof (data.detail as { error?: string }).error === "string"
        ? (data.detail as { error: string }).error
        : undefined;
  const status = err.response?.status ?? 0;
  if (!code && status === 403) code = "geo_blocked";
  if (!code) code = "server_error";

  console.warn("[siwaky/checkout] createOrder POST failed", {
    httpStatus: status,
    axiosCode: err.code,
    message: err.message,
    backendJson: data ?? null,
    postUrl: postUrlForLog,
    pathUsed: CHECKOUT_ORDER_POST_PATH,
  });

  return { code, status };
}

export async function createOrder(input: OrderCreateInput) {
  const postUrl = checkoutOrderPostAbsoluteUrl();

  console.log("[siwaky/checkout] createOrder POST start", {
    postUrl,
    path: CHECKOUT_ORDER_POST_PATH,
    offer: input.offer,
    quantity: input.quantity,
    price_sar: input.price_sar,
    overrideActive: typeof process.env.NEXT_PUBLIC_CHECKOUT_POST_URL === "string" &&
      process.env.NEXT_PUBLIC_CHECKOUT_POST_URL.trim().length > 0,
  });

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      headers["User-Agent"] = navigator.userAgent;
    }
    const { data } = await axios.post<OrderCreateResponse>(postUrl, input, {
      timeout: 15_000,
      headers,
    });
    console.log("[siwaky/checkout] createOrder POST success", {
      postUrl,
      order_id: data.order_id,
      status: data.status,
    });
    return { ok: true as const, data };
  } catch (err) {
    const e = err as AxiosError<{ error?: string; detail?: unknown }>;
    const { code, status } = axiosErrorPayload(e, postUrl);
    return { ok: false as const, code, status };
  }
}
