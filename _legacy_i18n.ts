import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export const locales = ["ar", "en"] as const;
export const defaultLocale = "ar" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : defaultLocale;
  if (!locales.includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Asia/Riyadh",
    now: new Date(),
  };
});
