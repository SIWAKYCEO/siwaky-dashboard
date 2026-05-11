import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import PixelsLoader from "@/components/shared/PixelsLoader";
import SocialProofTicker from "@/components/shared/SocialProofTicker";
import WhatsappFab from "@/components/shared/WhatsappFab";
import HtmlAttributes from "@/components/shared/HtmlAttributes";
import { locales, type Locale } from "@/i18n";

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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlAttributes lang={lang} dir={dir} />
      <div lang={lang} dir={dir} className="min-h-screen bg-brand-dark font-sans text-white">
        <Header />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <SocialProofTicker />
        <WhatsappFab />
        <PixelsLoader />
      </div>
    </NextIntlClientProvider>
  );
}
