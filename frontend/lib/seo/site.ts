/** Site-wide SEO constants — EMYRA LTD / SIWAKY · siwaky.com */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://siwaky.com").replace(/\/$/, "");

/** Primary product photography — hero, PDP gallery, cart thumb, Open Graph / Twitter cards. */
export const SITE_PRODUCT_IMAGE_PATH = "/images/product.jpg" as const;

export const COMPANY_LEGAL = "EMYRA LTD (UK)";
export const COMPANY_COUNTRY = "GB";

/** Keywords — Arabic brief list + brand */
export const SITE_KEYWORDS_AR = [
  "سواك",
  "مسواك",
  "سواك طبيعي",
  "سواك فاخر",
  "سواكي",
  "miswak",
  "natural miswak",
  "سواك السعودية",
  "oral care islamic",
  "SIWAKY",
];

export const SITE_KEYWORDS_EN = [
  "miswak",
  "natural miswak",
  "SIWAKY",
  "premium miswak",
  "miswak Saudi Arabia",
  "miswak GCC",
  "halal miswak",
  "Islamic oral care",
  "سواك",
  "سواكي",
];
