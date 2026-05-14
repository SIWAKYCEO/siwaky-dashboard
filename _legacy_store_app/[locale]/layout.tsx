import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import HtmlAttributes from "@/components/shared/HtmlAttributes";
import PixelsLoader from "@/components/shared/PixelsLoader";
import { locales, type Locale } from "@/i18n";
import { localBusinessSchema, organizationSchema } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: { locale: string } };

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale;

  const orgJson = JSON.stringify(organizationSchema());
  const localJson = JSON.stringify(localBusinessSchema());

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlAttributes lang={lang} dir={dir} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: localJson }} />
      <div lang={lang} dir={dir} className="min-h-screen bg-brand-dark font-sans text-white">
        <PixelsLoader />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
