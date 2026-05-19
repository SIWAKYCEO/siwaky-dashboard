import { COMPANY_COUNTRY, COMPANY_LEGAL, SITE_PRODUCT_IMAGE_PATH, SITE_URL } from "@/lib/seo/site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_LEGAL,
    legalName: COMPANY_LEGAL,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    brand: {
      "@type": "Brand",
      name: "SIWAKY",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: COMPANY_COUNTRY,
    },
    sameAs: [SITE_URL],
  };
}

/** GCC-focused storefront / Saudi primary market */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "SIWAKY",
    description:
      "Premium natural miswak in four flavors — Mint, Clove, Coconut, Natural. Halal certified. Delivery Saudi Arabia & GCC.",
    url: SITE_URL,
    parentOrganization: {
      "@type": "Organization",
      name: COMPANY_LEGAL,
      address: {
        "@type": "PostalAddress",
        addressCountry: COMPANY_COUNTRY,
      },
    },
    areaServed: [
      { "@type": "Country", name: "Saudi Arabia", identifier: "SA" },
      { "@type": "Place", name: "GCC" },
    ],
    makesOffer: {
      "@type": "Offer",
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/ar/product`,
    },
  };
}

export function productSchema(locale: string) {
  const description = "Natural miswak in 4 flavors, Halal certified";
  const name = "SIWAKY Premium Miswak Box";

  const offers = [
    { price: 245, name: locale === "ar" ? "علبة واحدة" : "One box" },
    { price: 299, name: locale === "ar" ? "علبتان" : "Two boxes" },
    { price: 349, name: locale === "ar" ? "ثلاث علب" : "Three boxes" },
  ].map((o) => ({
    "@type": "Offer",
    price: o.price,
    priceCurrency: "SAR",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/${locale}/product`,
    name: o.name,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: [`${SITE_URL}${SITE_PRODUCT_IMAGE_PATH}`],
    brand: { "@type": "Brand", name: "SIWAKY" },
    sku: "SIWAKY-BOX",
    offers,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
  };
}
