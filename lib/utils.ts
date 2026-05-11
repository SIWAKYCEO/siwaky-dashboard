export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatSAR(amount: number, locale: "ar" | "en") {
  const suffix = locale === "ar" ? "ر.س" : "SAR";
  return `${amount.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")} ${suffix}`;
}

export function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getUtm(): { source?: string; campaign?: string } {
  const w = safeWindow();
  if (!w) return {};
  const sp = new URLSearchParams(w.location.search);
  return {
    source: sp.get("utm_source") ?? undefined,
    campaign: sp.get("utm_campaign") ?? undefined,
  };
}
