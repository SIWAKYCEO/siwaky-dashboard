# Public assets

Drop the following files in this folder before deploy (or update component paths):

| File                  | What it is                                          |
| --------------------- | --------------------------------------------------- |
| `logo.png`            | SIWAKY calligraphy mark — white on transparent (source for favicons) |
| `favicon.ico`         | Multi-size ICO generated via `npm run generate:favicons`             |
| `static/icons/*.png`  | 16 / 32 / 48 / 512 px icons on `#28282A`                             |
| `apple-touch-icon.png`| 180×180 for iOS home screen                                          |
| `og.jpg`              | 1200×630 Open Graph image                            |
| `halal-cert.pdf`      | Halal certificate PDF (linked from the homepage)    |
| `manifest.webmanifest`| PWA manifest                                        |
| `images/hero.jpg`     | Hero background (dark, moody)                       |
| `images/story.jpg`    | Brand story column image                            |
| `images/cta.jpg`      | Final CTA background                                |
| `images/product.jpg`  | Square product hero photo                           |
| `images/product-1.jpg`–`product-4.jpg` | Product gallery thumbs            |

If a file is missing, the Logo component falls back to a typographic wordmark, the cert link 404s, and image-only sections degrade to dark gradients — but the rest of the site keeps working.
