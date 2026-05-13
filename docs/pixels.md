# SIWAKY — Pixels & CAPI

> Web pixels are **deferred** (load after `window.load + 2 s`).
> Every event has a UUID `event_id` shared with server CAPI for **deduplication**.

---

## 1. Pixel IDs

| Network   | Pixel / Tag                     | Env var                        |
| --------- | ------------------------------- | ------------------------------ |
| Meta      | `1898036304185332` ("siwaky pxl") | `NEXT_PUBLIC_META_PIXEL_ID`    |
| TikTok    | `D722UD3C77UDBCCMEAQG`           | `NEXT_PUBLIC_TIKTOK_PIXEL_ID`  |
| Snapchat  | `PLACEHOLDER_ADD_LATER`          | `NEXT_PUBLIC_SNAP_PIXEL_ID`    |

Backend (CAPI) tokens never reach the client — they live only in the FastAPI `.env`.

---

## 2. Web event map

| User action                  | Meta event         | TikTok event       | Snap event        |
| ---------------------------- | ------------------ | ------------------ | ----------------- |
| Page load                    | `PageView`         | `Pageview`         | `PAGE_VIEW`       |
| Land on /product             | `ViewContent`      | `ViewContent`      | `VIEW_CONTENT`    |
| AddToCart click              | `AddToCart`        | `AddToCart`        | `ADD_CART`        |
| Open checkout popup          | `InitiateCheckout` | `InitiateCheckout` | `START_CHECKOUT`  |
| Submit order (thank-you)     | `Purchase`         | `PlaceAnOrder`     | `PURCHASE`        |

### Event payload (common)
```json
{
  "event_id": "uuid-v4",
  "value": 299,
  "currency": "SAR",
  "content_ids": ["siwaky-box-2"],
  "contents": [{ "id": "siwaky-box-2", "quantity": 2, "item_price": 149.5 }],
  "content_type": "product"
}
```

---

## 3. Frontend implementation

### 3.1 Deferred loader (`lib/pixels.ts`)

```ts
let loaded = false;

export function deferPixels() {
  if (typeof window === "undefined" || loaded) return;
  loaded = true;
  const start = () => setTimeout(initAll, 2000);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
```

`initAll()` injects:
- Meta `fbq` snippet → calls `fbq('init', PIXEL_ID)` + `fbq('track', 'PageView', {}, { eventID })`.
- TikTok `ttq.load(PIXEL_ID)` + `ttq.page()`.
- Snap `snaptr('init', PIXEL_ID)` + `snaptr('track', 'PAGE_VIEW')`.

### 3.2 Tracking helper

```ts
import { v4 as uuid } from "uuid";

export const track = (name: EventName, payload: Payload = {}) => {
  const eventID = payload.event_id ?? uuid();
  // Meta
  window.fbq?.("track", META_MAP[name], payload, { eventID });
  // TikTok (use track or instant_track)
  window.ttq?.track(TT_MAP[name], { ...payload, event_id: eventID });
  // Snap
  window.snaptr?.("track", SNAP_MAP[name], { ...payload, client_dedup_id: eventID });
  return eventID;
};
```

### 3.3 When to fire

| Where                                      | Call                                       |
| ------------------------------------------ | ------------------------------------------ |
| `app/[locale]/layout.tsx` (client wrapper) | `deferPixels()` once                       |
| `app/[locale]/product/page.tsx`            | `track('ViewContent', { ... })`            |
| `cartStore.addItem` action                 | `track('AddToCart', { ... })`              |
| `CheckoutPopup` mount                       | `track('InitiateCheckout', { ... })`       |
| `/thank-you` page (mount, once)             | `track('Purchase', { value, event_id })` — `event_id` comes from order response |

---

## 4. Server-side CAPI

All CAPI calls run from `backend/app/services/pixels_capi.py` after a successful order insert.

### 4.1 Common hashing rules

- SHA-256, lowercase trimmed value before hash.
- Phone for **Meta**: digits only, prefix country code (`966...`).
- Phone for **TikTok**: prepend `+`, then hash (`+966...`).
- Phone for **Snap**: digits only with country code.

```python
def sha256_lower(v: str) -> str:
    return hashlib.sha256(v.strip().lower().encode()).hexdigest()
```

### 4.2 Meta

`POST https://graph.facebook.com/v18.0/{PIXEL_ID}/events?access_token={TOKEN}`

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1736512345,
    "event_id":   "<same uuid as web>",
    "action_source": "website",
    "event_source_url": "https://siwaky.com/ar/thank-you",
    "user_data": {
      "em": ["<sha256 email or null>"],
      "ph": ["<sha256 phone>"],
      "fn": ["<sha256 first>"],
      "ln": ["<sha256 last>"],
      "client_ip_address": "<ip>",
      "client_user_agent": "<ua>"
    },
    "custom_data": { "value": 299, "currency": "SAR", "content_ids": ["siwaky-box-2"], "content_type": "product" }
  }]
}
```

### 4.3 TikTok

`POST https://business-api.tiktok.com/open_api/v1.3/event/track/`
Header: `Access-Token: <token>`

```json
{
  "event_source": "web",
  "event_source_id": "D722UD3C77UDBCCMEAQG",
  "data": [{
    "event": "PlaceAnOrder",
    "event_time": 1736512345,
    "event_id":   "<uuid>",
    "user": {
      "phone": "<sha256 of +966...>",
      "email": "<sha256 email>",
      "ip":    "<ip>",
      "user_agent": "<ua>"
    },
    "properties": { "value": 299, "currency": "SAR", "contents": [{"content_id":"siwaky-box-2","quantity":2}] }
  }]
}
```

### 4.4 Snapchat

`POST https://tr.snapchat.com/v2/conversion`
Header: `Authorization: Bearer <token>`

```json
{
  "pixel_id": "<PIXEL_ID>",
  "event_type": "PURCHASE",
  "event_conversion_type": "WEB",
  "timestamp": 1736512345000,
  "client_dedup_id": "<uuid>",
  "hashed_phone_number": "<sha256>",
  "hashed_email": "<sha256>",
  "user_agent": "<ua>",
  "client_ip_address": "<ip>",
  "price": 299,
  "currency": "SAR",
  "item_ids": ["siwaky-box-2"],
  "number_items": 2
}
```

---

## 5. Deduplication

- Frontend & backend send the **same `event_id`** for the Purchase event.
- Meta/TikTok/Snap will treat duplicate `event_id` + `event_name` within a short window as a single conversion.
- For non-purchase events, deduping isn't critical (web only is fine).

---

## 6. Testing checklist

- [ ] Meta Events Manager → Test Events → see `Purchase` from **both** Browser and Server with same `event_id`.
- [ ] TikTok Events Manager → see `PlaceAnOrder` from web + CAPI matched.
- [ ] Snapchat Pixel debugger → see `PURCHASE` with `client_dedup_id`.
- [ ] Network tab: no pixel scripts load before `window.load + 2 s`.
- [ ] Whitelist phone `0550000000` fires events but does not create a confirmed Sheet row marked as production.
