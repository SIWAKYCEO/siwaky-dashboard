# Cloudflare caching — SIWAKY storefront

Use this together with **`frontend/next.config.js`** response headers and **`.github/workflows/purge-cloudflare-cache.yml`** so new deploys surface immediately.

---

## 1. Cloudflare Dashboard — Bypass cache by hostname (`siwaky.com`)

Dashboard → **Caching** → **Cache Rules** → **Create rule**

- **Rule name:** `Bypass cache — apex host`

- **When incoming requests match** (Examples → Edit expression):

  ```txt
  (http.host eq "siwaky.com")
  ```

  If visitors also hit **`www.siwaky.com`**, widen to:

  ```txt
  (http.host eq "siwaky.com") or (http.host eq "www.siwaky.com")
  ```

- **Then…**  

  Choose **Bypass cache**  
  _(UI may show **Cache eligibility: Bypass**, or legacy **Caching → Cache Level → Bypass**.)_

Save and reorder the rule above broad “cache everything” rules.

---

## 2. Headers from Next (`next.config.js`)

The app sets:

- **`/_next/static/*`** → long-lived immutable cache (filenames already change each build via `generateBuildId`).
- **HTML routes** `/`, `/ar/*`, `/en/*`, **`/dashboard/*`**, **`/api/dashboard/*`** → **`Cache-Control` no-store**, plus **`CDN-Cache-Control: no-store`** so edge layers that honour it bypass serving stale shells.
- **`/images/*`** and **`/logo.png`** → **`max-age=0, must-revalidate`** so CDN can keep bytes but always revalidate.

This intentionally **does not** apply `no-store` to `/_next/static/*`.

---

## 3. Automated purge via GitHub Actions

File: `.github/workflows/purge-cloudflare-cache.yml`

Triggers on **every push to `main`** and **`workflow_dispatch`**.

### Repo secrets  
**GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Where to find it |
|--------|-------------------|
| `CLOUDFLARE_ZONE_ID` | Cloudflare Dashboard → Domain → Overview → **Zone ID** |
| `CLOUDFLARE_API_TOKEN` | My Profile → **API Tokens** → Create custom token → **Zone → Cache Purge → Purge** on zone `siwaky.com`. |

If either secret is missing, the workflow **prints a warning and skips** purge (won’t fail the pipeline).

Uses **purge everything** (`POST /zones/:id/purge_cache`).

### Standalone frontend repository

If the Next app repo is **without** this monorepo root, copy the same workflow file under that repo’s **`.github/workflows/`** so Actions still runs on pushes there.

---

## 4. Verifying behaviour

After a deploy:

1. **Hard refresh once** locally (eliminates browser cache).
2. In Cloudflare, **Caching → Configuration → Purge Cache** manual **Purge Everything** can still be run if troubleshooting.
3. Call `curl -I https://siwaky.com/ar` — expect **`cache-control`** containing **`no-store`** / **`no-cache`** according to paths above.
