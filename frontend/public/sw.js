/* global self, clients */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch {
    try {
      payload = { body: event.data?.text() ?? "" };
    } catch {
      payload = {};
    }
  }

  const title = payload.title || "🌿 طلب جديد — سواكي";
  const body = payload.body || "";
  const icon = payload.icon || "/icons/icon-192x192.png";
  const tag = payload.tag || "siwaky-order";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag,
      renotify: true,
      data: payload,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  let path = typeof payload.url === "string" && payload.url ? payload.url : "/dashboard";
  if (!path.startsWith("/")) path = "/dashboard";

  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        try {
          const clientUrl = c.url || "";
          if (!clientUrl.includes(self.location.origin)) continue;
          if ("focus" in c) {
            await c.focus();
            c.postMessage({ type: "SIWAKY_DASH_PLAY_KACHING" });
            return;
          }
        } catch {
          /* ignore */
        }
      }
      if (clients.openWindow) {
        const target = new URL(path, self.location.origin);
        target.searchParams.set("dashPushChime", "1");
        await clients.openWindow(target.href);
      }
    })(),
  );
});
