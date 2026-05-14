import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import LegalDocumentView from "@/components/legal/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal/documents";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.legalPrivacy" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "/privacy-policy",
      title: t("title"),
      description: t("description"),
      ogTitle: t("ogTitle"),
      ogDescription: t("ogDescription"),
      twitterTitle: t("twitterTitle"),
      twitterDescription: t("twitterDescription"),
    }),
  );
}

export default async function PrivacyPolicyPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  const doc = getLegalDocument(locale, "privacy");

  return <LegalDocumentView locale={locale} doc={doc} />;
}
