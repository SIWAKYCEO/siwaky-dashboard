import type { Metadata } from "next";

import { SITE_KEYWORDS_AR, SITE_KEYWORDS_EN, SITE_PRODUCT_IMAGE_PATH, SITE_URL } from "@/lib/seo/site";

/** Normalised path segment without locale: "", "/product", "/about", … */
export function normalisePath(path: string): string {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(locale: string, pathSuffix: string): string {
  const seg = normalisePath(pathSuffix);
  return `${SITE_URL}/${locale}${seg}`;
}

/** Defaults merged from `[locale]/layout` for every localized route */
export function localeShellMetadata(locale: string): Metadata {
  const keywords = locale === "ar" ? SITE_KEYWORDS_AR : SITE_KEYWORDS_EN;
  return {
    metadataBase: new URL(SITE_URL),
    keywords,
    authors: [{ name: "EMYRA LTD (UK)", url: SITE_URL }],
    creator: "EMYRA LTD (UK)",
    publisher: "EMYRA LTD (UK)",
    category: "health",
    openGraph: {
      type: "website",
      siteName: "SIWAKY",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      images: [
        {
          url: SITE_PRODUCT_IMAGE_PATH,
          width: 1200,
          height: 1200,
          alt:
            locale === "ar"
              ? "علبة سواكي الفاخرة مع أعواد السواك الطبيعية"
              : "SIWAKY premium miswak box with natural sticks",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    other: {
      "geo.region": "SA",
      "geo.placename": "Saudi Arabia",
      "geo.position": "24.7136;46.6753",
      ICBM: "24.7136, 46.6753",
      "business:contact_data:country_name": "Saudi Arabia",
    },
    formatDetection: { telephone: false },
  };
}

/** Deep-merge locale shell defaults with page-level metadata from `buildPageMetadata`. */
export function mergeLocaleShell(locale: string, page: Metadata): Metadata {
  const shell = localeShellMetadata(locale);
  const ogShell = shell.openGraph ?? {};
  const ogPage = page.openGraph ?? {};
  const twShell = shell.twitter ?? {};
  const twPage = page.twitter ?? {};

  return {
    ...shell,
    ...page,
    openGraph: {
      ...ogShell,
      ...ogPage,
      images: ogPage.images ?? ogShell.images,
    },
    twitter: {
      ...twShell,
      ...twPage,
    },
    other: {
      ...(shell.other ?? {}),
      ...(page.other ?? {}),
    },
    robots: page.robots !== undefined ? page.robots : shell.robots,
  };
}

export interface PageMetadataInput {
  locale: string;
  /** Path without locale prefix */
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  robots?: Metadata["robots"];
}

/** Per-route canonical, hreflang, Open Graph URL, Twitter */
export function buildPageMetadata(opts: PageMetadataInput): Metadata {
  const seg = normalisePath(opts.path);
  const urlAr = `${SITE_URL}/ar${seg}`;
  const urlEn = `${SITE_URL}/en${seg}`;
  const canonical = `${SITE_URL}/${opts.locale}${seg}`;
  const ogTitle = opts.ogTitle ?? opts.title;
  const ogDesc = opts.ogDescription ?? opts.description;
  const twTitle = opts.twitterTitle ?? ogTitle;
  const twDesc = opts.twitterDescription ?? ogDesc;

  return {
    title: opts.title,
    description: opts.description,
    robots: opts.robots,
    alternates: {
      canonical,
      languages: {
        "ar-SA": urlAr,
        en: urlEn,
        "x-default": urlAr,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      locale: opts.locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
      siteName: "SIWAKY",
      images: [
        {
          url: `${SITE_URL}${SITE_PRODUCT_IMAGE_PATH}`,
          width: 1200,
          height: 1200,
          alt:
            opts.locale === "ar"
              ? "علبة سواكي الفاخرة مع أعواد السواك الطبيعية"
              : "SIWAKY premium miswak box with natural sticks",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twTitle,
      description: twDesc,
      images: [`${SITE_URL}${SITE_PRODUCT_IMAGE_PATH}`],
    },
  };
}
