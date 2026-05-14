"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Row {
  feature: string;
  us: boolean;
  other: boolean;
}

export default function ProductComparisonTable() {
  const t = useTranslations("product.comparison");
  const rows = t.raw("rows") as Row[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <h2 className="text-center font-display text-2xl leading-snug text-white md:text-[2.35rem]">
          {t("title")}
        </h2>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[#28282A] shadow-[inset_0_1px_0_rgba(201,168,76,0.06)] md:overflow-visible">
          <table className="w-full min-w-[340px] border-collapse font-sans text-sm md:text-base rtl:text-right">
            <thead>
              <tr className="border-b border-brand-gold/35 bg-[#1A1A1A]/90">
                <th scope="col" className="px-4 py-4 font-semibold text-brand-goldLight md:px-6">
                  {t("colFeature")}
                </th>
                <th scope="col" className="px-4 py-4 font-semibold text-brand-gold md:px-6">
                  {t("colUs")}
                </th>
                <th scope="col" className="px-4 py-4 font-semibold text-white/55 md:px-6">
                  {t("colOther")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/[0.06] last:border-b-0"
                >
                  <td className="px-4 py-3.5 text-white/90 md:px-6">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center text-brand-gold md:px-6">{row.us ? "✅" : "❌"}</td>
                  <td className="px-4 py-3.5 text-center text-white/45 md:px-6">{row.other ? "✅" : "❌"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}
