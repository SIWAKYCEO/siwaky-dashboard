import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ContactForm from "@/components/contact/ContactForm";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props { params: { locale: string }; }

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "/contact",
      title: t("title"),
      description: t("description"),
      ogTitle: t("ogTitle"),
      ogDescription: t("ogDescription"),
      twitterTitle: t("twitterTitle"),
      twitterDescription: t("twitterDescription"),
    }),
  );
}

export default async function ContactPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="bg-brand-dark">
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl text-white md:text-6xl">{t("contact.title")}</h1>
          <p className="mt-4 text-white/75">{t("contact.sub")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          <div className="card-luxury text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-goldLight">
              {t("contact.email_label")}
            </p>
            <a
              href="mailto:siwaky.assistance@gmail.com"
              className="mt-2 block break-all text-sm text-white/85 hover:text-brand-goldLight"
            >
              siwaky.assistance@gmail.com
            </a>
          </div>
          <div className="card-luxury text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-goldLight">
              {t("contact.whatsapp_label")}
            </p>
            <p className="mt-2 text-sm text-white/85">{t("contact.whatsappSoon")}</p>
          </div>
          <div className="card-luxury text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-goldLight">EMYRA LTD (UK)</p>
            <p className="mt-2 text-sm text-white/85">United Kingdom</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
