"use client";

import { motion } from "framer-motion";
import { Award, Download } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HalalCertSection() {
  const t = useTranslations("halal");
  return (
    <section className="section-padding bg-[#28282A]">
      <div className="container-luxury">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-dark2 to-brand-dark p-10 text-center shadow-gold"
        >
          <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full bg-brand-gold/10 p-4">
            <Award className="size-10 text-brand-gold" />
          </div>
          <h2 className="font-display text-3xl text-white md:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-white/75">{t("sub")}</p>

          <span className="my-6 block divider-gold" />

          <div className="grid gap-4 text-sm text-white/70 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-brand-dark2/60 p-4">
              <p className="text-brand-goldLight">{t("certNo")}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-brand-dark2/60 p-4">
              <p className="text-brand-goldLight">{t("validUntil")}</p>
            </div>
          </div>

          <a
            href="/halal-cert.pdf"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost-gold mt-8"
          >
            <Download className="size-4" />
            {t("download")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
