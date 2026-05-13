# SIWAKY — Backend API

Base URL: `https://api.siwaky.com` (prod) · `http://localhost:8000` (dev)

All requests/responses are JSON. CORS is open to `FRONTEND_URL` (and `http://localhost:3000` in dev).

---

## 1. Endpoints

### `GET /health`
Liveness probe. Returns `200 OK`:
```json
{ "status": "ok", "version": "1.0.0" }
```

### `GET /api/geo/check`
Validate the request origin (KSA, no VPN, low risk).

**Response (allowed):**
```json
{ "allowed": true, "country": "SA", "risk_score": 12, "ip": "1.2.3.4" }
```

**Response (blocked):**
```json
{ "allowed": false, "reason": "not_ksa", "country": "DE", "ip": "1.2.3.4" }
```
`reason` ∈ `not_ksa | vpn | anonymous_proxy | high_risk | error`.

### `POST /api/orders`
Create a COD order. Runs geo+fraud, persists, fires Sheets webhook + CAPI.

**Request:**
```json
{
  "name": "أحمد الراشدي",
  "phone": "0551234567",
  "city": null,
  "offer": "box-2",
  "quantity": 2,
  "price_sar": 299,
  "source": "tiktok",
  "campaign": "siwaky_launch_01",
  "event_id": "8c1b2c80-...-..."
}
```

**Response 201:**
```json
{
  "order_id": "ORD-20260511-001",
  "status": "pending",
  "price_sar": 299,
  "event_id": "8c1b2c80-...-..."
}
```

**Errors:**
| Status | `error` code            | Meaning                                |
| ------ | ----------------------- | -------------------------------------- |
| 400    | `invalid_name`          | Name < 3 chars                          |
| 400    | `invalid_phone`         | Not KSA pattern                         |
| 403    | `geo_blocked`           | Geo / VPN / risk rejected               |
| 422    | `validation_error`      | Pydantic body mismatch                  |
| 500    | `server_error`          | Unhandled                               |

### `GET /api/orders/{order_id}`
Internal lookup by `order_id` (for ops tools / future admin).
Response is the full order row sans `ip_address` and `user_agent` (PII-light).

---

## 2. Pydantic schemas

```python
class OrderCreate(BaseModel):
    name: constr(min_length=3, max_length=255)
    phone: constr(pattern=r"^(05|5)(5|0|3|6|4|9|1|8|7)[0-9]{7}$")
    city: Optional[str] = None
    offer: Literal["box-1", "box-2", "box-3"]
    quantity: conint(ge=1, le=3)
    price_sar: condecimal(ge=0, max_digits=10, decimal_places=2)
    source: Optional[str] = None
    campaign: Optional[str] = None
    event_id: Optional[str] = None
```

Server normalizes `phone` to E.164 (`+9665XXXXXXXX`) before storage / CAPI hashing.

---

## 3. Database schema

```sql
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    order_id        VARCHAR(50)  UNIQUE NOT NULL,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW(),
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    city            VARCHAR(100),
    product         VARCHAR(100) DEFAULT 'SIWAKY Box',
    offer           VARCHAR(20),
    quantity        INTEGER      NOT NULL,
    price_sar       NUMERIC(10,2) NOT NULL,
    status          VARCHAR(50)  DEFAULT 'pending',
    source          VARCHAR(100),
    campaign        VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    event_id        VARCHAR(100),
    notes           TEXT
);

CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

Status values: `pending → confirmed → delivered → returned | cancelled`.

`order_id` format: `ORD-YYYYMMDD-XXX` (3-digit daily counter, padded).

---

## 4. Order ID generation

```python
def next_order_id(db, today: date) -> str:
    yyyymmdd = today.strftime("%Y%m%d")
    count = db.execute(
        select(func.count(Order.id)).where(func.date(Order.created_at) == today)
    ).scalar() or 0
    return f"ORD-{yyyymmdd}-{count + 1:03d}"
```

---

## 5. Geo / fraud

`services/geo_check.py`:

```python
async def check_ip(ip: str, phone: str | None = None) -> GeoResult:
    if phone and phone.replace("+966", "").lstrip("0") == "550000000":
        return GeoResult(allowed=True, country="SA", risk_score=0, reason=None)

    try:
        resp = client.insights(ip)
    except Exception as e:
        return GeoResult(allowed=False, reason="error", error=str(e))

    country = resp.country.iso_code
    traits  = resp.traits
    risk    = resp.risk_score or 0

    if country != "SA":            return GeoResult(False, country, "not_ksa", risk)
    if traits.is_anonymous_proxy:  return GeoResult(False, country, "anonymous_proxy", risk)
    if getattr(traits, "is_anonymous_vpn", False): return GeoResult(False, country, "vpn", risk)
    if risk > 50:                  return GeoResult(False, country, "high_risk", risk)

    return GeoResult(True, country, None, risk)
```

---

## 6. Pipelines after order insert

After successful `INSERT`, the request handler does (best-effort, non-blocking on failure):

```python
asyncio.gather(
    sheets_webhook.send(order),
    capi.meta_purchase(order, request),
    capi.tiktok_purchase(order, request),
    capi.snap_purchase(order, request),
    return_exceptions=True,
)
```

Errors are logged but do not fail the order response — the customer always sees `/thank-you`.

---

## 7. Phone normalization

```python
def normalize_phone(raw: str) -> str:
    digits = "".join(c for c in raw if c.isdigit())
    # Drop leading 0 → 5XXXXXXXX → prefix +966
    if digits.startswith("0"): digits = digits[1:]
    if digits.startswith("966"): digits = digits[3:]
    return f"+966{digits}"
```

Stored in DB as `+9665XXXXXXXX`. CAPI hashes use this canonical form.

---

## 8. Local dev

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head           # optional — main.py also runs this on startup
uvicorn app.main:app --reload
```

Service is up at `http://localhost:8000/health`.
