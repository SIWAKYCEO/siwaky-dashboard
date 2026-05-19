/** Base64url (VAPID / push) → Uint8Array for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const noOtherBrowser = !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return iOS && webkit && noOtherBrowser;
}

/** iPhone / iPod / iPad — used for install + push guidance. */
export function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

/**
 * True when opened from Home Screen / installed PWA (required for Web Push on iOS).
 */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

export function supportsScreenWakeLock(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator && typeof navigator.wakeLock?.request === "function";
}
