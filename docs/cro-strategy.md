# SIWAKY — CRO Strategy

> **Goals (in order):** CVR · AOV · Confirmation rate · Delivery rate.
> **Channels:** TikTok (60%), Meta (25%), Snapchat (15%) — KSA mobile-first traffic.

---

## 1. CVR levers (above-the-fold)

| Element                         | Where                          | Why it works                                              |
| ------------------------------- | ------------------------------ | --------------------------------------------------------- |
| Single-product page (Direct Response landing) | `/product`           | Removes catalog choice paralysis                          |
| Sticky bottom CTA (mobile)      | Product page                   | Always tappable; lowers click-to-cart friction            |
| Default-selected best-seller offer | Offer selector              | Anchors at 2-box (higher AOV) without forcing             |
| Big trust row under hero CTA    | Hero + Product page            | حلال · طبيعي · توصيل · ضمان → relieves anxiety            |
| 2-field checkout (name + phone) | Checkout popup                 | Lowest friction in KSA market                              |
| COD as the only payment         | Checkout copy                  | Removes card-entry abandonment                            |
| Saudi-only validation early     | Phone regex + GeoIP            | Improves delivery rate, kills VPN/proxy fraud              |

## 2. AOV levers

### Offer selector (default 2-box)

```
○  علبة واحدة          245 ر.س   (anchor)
◉  علبتين  🔥 الأكثر مبيعاً   299 ر.س   ← default, "save 191 ر.س"
○  ثلاث علب  💎 أفضل قيمة     349 ر.س   ← "save 386 ر.س"
```

Why these numbers:
- 1 box anchor at 245 ر.س makes 2 boxes feel like ~1.2× the price for 2× the product.
- "وفّر" labels turn marginal cost into a perceived gain.
- The 3-box tier exists to make the 2-box look "reasonable" (decoy effect).

### Cart-drawer upgrade prompt

When cart = 1 box, show "أضف علبة ثانية وادفع 54 ر.س فقط".
When cart = 2 boxes, show "أضف علبة ثالثة وادفع 50 ر.س فقط".

This is a non-intrusive in-cart upsell — one-tap to upgrade tier, no extra form.

### Free shipping

Free shipping is the default — never put behind a threshold for COD KSA traffic.

## 3. Urgency & scarcity

| Element                                                | Page                | Notes                                       |
| ------------------------------------------------------ | ------------------- | ------------------------------------------- |
| `ScarcityBar` — "🔴 تبقى X علبة فقط"                   | Product · Cart      | X starts at 12 and ticks down on view (client) |
| `CountdownTimer` — "العرض ينتهي خلال HH:MM:SS"          | Product hero        | 24h rolling countdown, resets per session    |
| "🔴 تبقى 8 طلبات فقط بهذا السعر!"                       | Checkout popup      | Final push during decision moment            |
| `SocialProofTicker` — "أحمد من الرياض طلب للتو"         | Product (floating)  | Names + cities rotate every 8s                |

All scarcity copy is honest about being "limited offer" — keep within KSA advertising norms.

## 4. Trust signals

| Signal                                              | Placement                  |
| --------------------------------------------------- | -------------------------- |
| Halal certificate (CR/IHCP/SAC/03/26/HC)            | Hero + Product + Footer    |
| 4.9 ★ + 127 reviews                                 | Product title              |
| 6 KSA-dialect testimonials (Riyadh/Jeddah/Dammam)    | Homepage + Product          |
| COD badge — "لا بيانات بنكية مطلوبة"                  | Cart + Checkout            |
| "ضمان الاسترجاع" / refund                           | Trust row + FAQ            |
| `EMYRA LTD` (UK) — legal footer                     | Footer                     |

## 5. Confirmation rate (call-center pickup)

Confirmation calls fail most often because of bad data or low intent.

**Improvements baked in:**

1. **KSA-only phone regex** rejects mistyped numbers up-front.
2. **MaxMind GeoIP2** rejects VPNs / non-KSA IPs (typical bot/affiliate fraud).
3. **risk_score > 50 → reject** before order persists.
4. **Whitelist `0550000000`** for QA so pixel testing never spams sheets.
5. **Sheet auto-populates** Date/Time/Source/Campaign → call agent sees ad context.
6. **Single-page checkout** drastically reduces "I changed my mind" gap.
7. **Thank-You page** instantly says "سيتصل بك فريقنا" → sets the expectation.

## 6. Delivery rate

| Lever                                                  | Effect                                  |
| ------------------------------------------------------ | --------------------------------------- |
| Phone regex (`05XXXXXXXX` only)                         | Eliminates fake numbers                  |
| Geo + VPN filtering                                    | Drops fraud orders before fulfilment     |
| 5% **COD fee column** auto-calculated in sheet         | Visibility on shipping carrier cost      |
| `delivered` column in sheet                            | Ops can mark + correlate to ad source    |
| Returned column                                        | Cohort-track which creatives bring returns |

## 7. Mobile-first rules

- All CTAs ≥ 48 px tall.
- Single thumb reach: primary CTA stays within the bottom 33% of viewport.
- No hover-only affordances — every state must have a tap interaction.
- Defer **all** pixels (Meta/TikTok/Snap) until `window.load + 2s`.
- Lazy-load below-the-fold sections via `react-intersection-observer` patterns built into Framer Motion (`whileInView`).

## 8. Pixel attribution

- Web pixel + server CAPI **share the same `event_id` UUID**. Always send Purchase from both sides — Meta/TikTok dedup automatically.
- Pull `source` and `campaign` from URL params on landing (`?utm_source=tiktok&utm_campaign=launch_01`). Store in cart store; submit with the order.

## 9. Page-level KPIs to track

| Page              | Primary KPI            | Secondary                      |
| ----------------- | ---------------------- | ------------------------------- |
| Home              | CTR → product           | Time on page · scroll depth     |
| Product           | AddToCart rate          | Offer-tier distribution         |
| Cart drawer       | InitiateCheckout rate   | Upgrade-acceptance rate         |
| Checkout popup    | Order submit rate       | Phone-validation failure rate   |
| Thank-You         | Confirmation rate (CRM) | Refund/return rate (sheet)      |

## 10. Anti-patterns we intentionally avoided

- ❌ Multi-step checkout
- ❌ Account creation / email signup gate
- ❌ Credit-card form
- ❌ Floating discount popup on first load (kills LCP + annoys mobile)
- ❌ Auto-playing audio
- ❌ "Spin the wheel" gamified discount overlays (not on-brand for luxury)
