/**
 * Deferred pixel loading + dedup helper for Meta, TikTok, Snapchat.
 *
 * Pixels are loaded ~2 s after `window.load`. Every event carries a UUID
 * `event_id` shared with backend CAPI so the conversion is counted once.
 */
import { v4 as uuid } from "uuid";

type EventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

const META: Record<EventName, string> = {
  PageView: "PageView",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "Purchase",
};

const TIKTOK: Record<EventName, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "PlaceAnOrder",
};

const SNAP: Record<EventName, string> = {
  PageView: "PAGE_VIEW",
  ViewContent: "VIEW_CONTENT",
  AddToCart: "ADD_CART",
  InitiateCheckout: "START_CHECKOUT",
  Purchase: "PURCHASE",
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (name: string, payload?: object) => void };
    snaptr?: (...args: unknown[]) => void;
    _siwakyPixelsReady?: boolean;
  }
}

let initialized = false;

export function deferPixels() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;

  const start = () => window.setTimeout(loadPixels, 2000);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

function loadPixels() {
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const snapId = process.env.NEXT_PUBLIC_SNAP_PIXEL_ID;

  if (metaId) loadMeta(metaId);
  if (tiktokId) loadTikTok(tiktokId);
  if (snapId && snapId !== "PLACEHOLDER_ADD_LATER") loadSnap(snapId);

  window._siwakyPixelsReady = true;
  // Fire the queued PageView once everyone is on
  track("PageView");
}

function loadMeta(id: string) {
  (function (f: Window, b: Document, e: string, v: string) {
    if ((f as any).fbq) return;
    const n: any = ((f as any).fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!(f as any)._fbq) (f as any)._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq?.("init", id);
}

function loadTikTok(id: string) {
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
    ];
    ttq.setAndDefer = function (this: any, t: any, e: string) {
      this[e] = function () {
        // eslint-disable-next-line prefer-rest-params
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++)
      ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (e: string) {
      const n = ttq._i[e] || [];
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(n, ttq.methods[i]);
      return n;
    };
    ttq.load = function (e: string, n?: any) {
      const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      const o = document.createElement("script");
      o.type = "text/javascript";
      o.async = true;
      o.src = `${r}?sdkid=${e}&lib=ttq`;
      const a = document.getElementsByTagName("script")[0];
      a.parentNode?.insertBefore(o, a);
    };
    ttq.load(id);
    ttq.page();
  })(window as any, document, "ttq");
}

function loadSnap(id: string) {
  (function (e: Window, t: Document, n: any) {
    if (!(e as any).snaptr) {
      const a: any = ((e as any).snaptr = function () {
        a.handleRequest
          ? // eslint-disable-next-line prefer-rest-params
            a.handleRequest.apply(a, arguments)
          : // eslint-disable-next-line prefer-rest-params
            a.queue.push(arguments);
      });
      a.queue = [];
      const r = "script";
      const c = t.createElement(r) as HTMLScriptElement;
      c.async = true;
      c.src = "https://sc-static.net/scevent.min.js";
      const s = t.getElementsByTagName(r)[0];
      s.parentNode?.insertBefore(c, s);
    }
  })(window, document, undefined);
  window.snaptr?.("init", id);
}

/** Fire an event on all available pixels with a shared event_id. */
export function track(name: EventName, payload: Record<string, unknown> = {}) {
  const eventID = (payload.event_id as string) ?? uuid();
  payload.event_id = eventID;

  try {
    window.fbq?.("track", META[name], payload, { eventID });
  } catch {}
  try {
    window.ttq?.track(TIKTOK[name], { ...payload, event_id: eventID });
  } catch {}
  try {
    window.snaptr?.("track", SNAP[name], { ...payload, client_dedup_id: eventID });
  } catch {}

  return eventID;
}
