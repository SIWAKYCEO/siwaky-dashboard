"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ThankYouContent() {
  const t = useTranslations("thankYou");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <section className="container-luxury py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="mx-auto inline-flex size-24 items-center justify-center rounded-full bg-brand-gold/10 ring-1 ring-brand-gold/40"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
            className="inline-flex size-16 items-center justify-center rounded-full bg-brand-gold"
          >
            <Check className="size-9 text-brand-dark" strokeWidth={3.5} />
          </motion.span>
        </motion.div>

        <h1 className="mt-8 font-display text-4xl text-white md:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-white/80">{t("sub")}</p>
        <p className="mt-3 text-sm text-brand-goldLight">{t("delivery")}</p>

        {orderId && (
          <p className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/70">
            {t("orderId")}: <span className="ms-2 font-mono text-brand-goldLight">{orderId}</span>
          </p>
        )}

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href={`/${locale}`} className="btn-ghost-gold">
            {t("backHome")}
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("جربت سواكي وكان رائع! https://siwaky.com")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            {t("shareTitle")}
          </a>
        </div>
      </div>
    </section>
  );
}
