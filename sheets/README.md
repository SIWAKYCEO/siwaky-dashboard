# SIWAKY — Google Sheets operations

Every order placed on `siwaky.com` is **persisted in PostgreSQL first**, then
fanned out (best-effort) to a Google Apps Script webhook that appends a row to
the **📦 Orders** tab of the SIWAKY operations sheet.

This is what the call-center / fulfillment team works from.

---

## 1. Create the spreadsheet

Create a new Google Sheet named **`SIWAKY_Orders`** with a tab named **`📦 Orders`**.

Recommended header row (place in **row 3**, leave rows 1–2 for the brand title block and KPIs):

| # | Date | Time | Name | Phone | City | Product | Qty | Price SAR | Status | Confirmed | Delivered | Returned | COD Fee | Source | Campaign | Notes | Order ID |
|---|------|------|------|-------|------|---------|-----|-----------|--------|-----------|-----------|----------|---------|--------|----------|-------|----------|

The webhook writes 18 columns to each new row starting at row 4.

### Suggested data validation

| Column      | Validation                                        |
| ----------- | ------------------------------------------------- |
| Status      | dropdown: `Pending`, `Confirmed`, `Delivered`, `Returned`, `Cancelled` |
| Confirmed   | dropdown: `Yes`, `No`                              |
| Delivered   | dropdown: `Yes`, `No`                              |
| Returned    | dropdown: `Yes`, `No`                              |
| COD Fee     | format: number, 2 decimals                         |

### Useful at-a-glance formulas (row 1)

```
=COUNTA(D4:D)                                — Total orders
=COUNTIF(K4:K, "Yes")                         — Confirmed
=COUNTIF(L4:L, "Yes")                         — Delivered
=SUMIF(L4:L, "Yes", I4:I)                     — Revenue (delivered only)
=COUNTIF(L4:L, "Yes") / COUNTA(D4:D)          — Delivery rate
=COUNTIF(K4:K, "Yes") / COUNTA(D4:D)          — Confirmation rate
```

## 2. Install the Apps Script

1. In the sheet → **Extensions → Apps Script**.
2. Replace the default `Code.gs` with the contents of [`webhook_script.js`](./webhook_script.js).
3. **File → Project properties → Script properties** → add:
   - `SHEET_ID` → the spreadsheet ID (the long alphanumeric string in the sheet URL).
   - `WEBHOOK_SECRET` → a long random string. This must match `SHEETS_WEBHOOK_SECRET` in the backend `.env`.
4. **Deploy → New deployment → Web app:**
   - Description: `SIWAKY orders webhook v1`
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the deployment URL → backend `.env` → `SHEETS_WEBHOOK_URL`.

> Apps Script requires you to **re-deploy** (`Manage deployments → New version`) every time you edit the script.

## 3. Test the webhook

From a terminal (replace `URL` and `SECRET`):

```bash
jq -cn --arg s "REPLACE_WITH_SECRET" '{
    "secret": $s,
    "date":"11/05/2026",
    "time":"14:32",
    "name":"اختبار الخادم",
    "phone":"+966551234567",
    "city":"الرياض",
    "country":"SA",
    "product":"SIWAKY Box x2",
    "quantity": 2,
    "price": 299,
    "status":"Pending",
    "ip_address":"127.0.0.1",
    "device":"Desktop"
  }' | curl -fsS \
     -X POST "$URL" \
     -L --post302 \
     --max-time 30 \
     -H "Content-Type: application/json" \
     --data-binary @-
```

Expect `{"ok":true,"row":N}`. Troubleshooting replies from `doPost`:

| JSON | Meaning |
|------|---------|
| `missing_sheet_id` | Add `SHEET_ID` in **Script properties** (spreadsheet ID from the Sheet URL). |
| `unauthorized` | Backend `SHEETS_WEBHOOK_SECRET` ≠ Apps Script property `WEBHOOK_SECRET`. |
| HTML Drive error via `curl` | Try `jq … \| curl … -L --post302` exactly as above — plain `curl -L -X POST` often drops POST on the 302 from `script.google.com`. |

Production backend installs **`curl-cffi`** so redirects behave like Chrome/Node (`fetch`).

## 4. Production flow

```
POST /api/orders  ──► PostgreSQL (orders)
                  └─► sheets webhook ──► 📦 Orders tab
                  └─► Meta / TikTok / Snap CAPI
```

If the Apps Script call fails, the order is **still saved** — the failure is logged
backend-side. Re-run can be added later via an admin endpoint if needed.

## 5. Security

- The webhook URL is "Anyone"-accessible, so always set `WEBHOOK_SECRET` and
  rotate it if it leaks. The backend will refuse to call without one.
- Do not paste real customer data into shared docs/screenshots from this sheet
  (phone numbers are PII).
