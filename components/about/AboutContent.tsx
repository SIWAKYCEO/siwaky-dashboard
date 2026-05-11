"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

/* ─────────────────────────── Content data ─────────────────────────── */

const CONTENT = {
  ar: {
    dir: "rtl" as const,
    heroName: "سيواكي",
    heroSub: "حيث تلتقي السنّة بالفخامة",
    p1: "لم تُولَد سيواكي لتكون مجرد منتج على رف، بل وُلدت لتحمل رسالة. رسالة تؤمن بأن ما أوصى به نبيّنا ﷺ يستحق أن يُقدَّم بأرقى صورة ممكنة، وأن الأصالة والفخامة ليستا نقيضين، بل وجهان لعملة واحدة.",
    hadith: "« السواك مطهرة للفم مرضاة للرب »",
    hadithSrc: "— النبي محمد ﷺ",
    p2: "المسواك ليس مجرد عود من شجرة الأراك. هو إرث عابر للأجيال، ورمز للنقاء الذي جمع بين العبادة والعناية. استخدمه أجدادنا يوميًا، ووصى به النبي ﷺ لما يحمله من طهارة حقيقية لا تصنعها المواد الكيميائية.\n\nفي سيواكي، أخذنا هذا الإرث العريق وأعدنا تقديمه بعين المعاصرة ويد المتقن. اخترنا أجود أنواع الأراك — Salvadora Persica — وأضفنا نكهات طبيعية راقية: النعناع، والقرنفل، وجوز الهند، والطبيعي الأصيل. كل ذلك في تغليف يليق بمكانة السنّة.",
    values: [
      { icon: "🌿", title: "الأصالة",   body: "نستخدم فقط الأراك الطبيعي المختار بعناية، بلا مواد كيميائية، بلا مواد مصطنعة." },
      { icon: "📖", title: "الالتزام",  body: "كل منتج نصنعه مبني على قيم راسخة، ومعتمد بشهادة الحلال العالمية." },
      { icon: "✨", title: "الرقي",     body: "من جودة المنتج إلى تصميم التغليف، كل تفصيلة في سيواكي مدروسة بإتقان." },
      { icon: "🎁", title: "المعنى",    body: "نؤمن أن البساطة عندما تُقدَّم بإتقان، تتحول إلى فخامة حقيقية." },
    ],
    closing1: "سيواكي ليست عناية يومية فحسب. هي انعكاس لأسلوب حياة يقوم على ثلاثة أركان: الاهتمام بالنفس — الالتزام بالقيم — التوازن بين الماضي والحاضر.",
    closing2: "نحن لا نبني منتجًا، نحن نبني إرثًا.",
    closingTag: "سيواكي — حيث تلتقي السنّة بالأناقة.",
    toggleLabel: "EN",
    fontClass: "font-naskh",
    displayClass: "font-display",
  },
  en: {
    dir: "ltr" as const,
    heroName: "SIWAKY",
    heroSub: "Where Tradition Meets Luxury",
    p1: "SIWAKY was not created to be just another product. It was born from a deeper purpose — a belief that what our Prophet ﷺ recommended deserves to be presented in the finest way possible. That authenticity and luxury are not opposites, but two sides of the same coin.",
    hadith: "\u201cThe miswak cleanses the mouth and pleases the Lord.\u201d",
    hadithSrc: "— Prophet Muhammad \uFDFA",
    p2: "The miswak is not simply a twig from the Arak tree. It is a timeless legacy — a symbol of purity that united worship and self-care across generations. Our ancestors used it daily, and our Prophet ﷺ recommended it for the genuine cleanliness it provides, untouched by chemicals or artificiality.\n\nAt SIWAKY, we took this ancient heritage and reimagined it through a modern lens and a craftsman's hand. We carefully selected the finest Salvadora Persica Arak, and added refined natural flavors — Mint, Clove, Coconut, and Pure Natural — all presented in packaging worthy of the Sunnah it represents.",
    values: [
      { icon: "🌿", title: "Authenticity", body: "Only the finest naturally sourced Arak, free from chemicals and artificial additives." },
      { icon: "📖", title: "Integrity",    body: "Every product we create is built on firm values and certified by International Halal Certification." },
      { icon: "✨", title: "Excellence",   body: "From product quality to packaging design, every detail in SIWAKY is crafted with precision." },
      { icon: "🎁", title: "Meaning",      body: "We believe that simplicity, when delivered with mastery, becomes true luxury." },
    ],
    closing1: "SIWAKY is more than a daily ritual. It is a reflection of a lifestyle built on three pillars: care for oneself, commitment to values, and harmony between past and present.",
    closing2: "We are not building a product. We are building a legacy.",
    closingTag: "SIWAKY — Where the Sunnah meets elegance.",
    toggleLabel: "AR",
    fontClass: "font-sans",
    displayClass: "font-serif",
  },
} as const;

type Lang = keyof typeof CONTENT;

/* ─────────────────────────── Animation variants ─────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function AboutContent({ initialLang }: { initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "ar");
  const c = CONTENT[lang];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={lang}
        dir={c.dir}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        className="bg-brand-dark"
      >
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden px-5 text-center">
          {/* background radials */}
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-brand-gold/6 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/4 size-[400px] rounded-full bg-brand-goldDark/8 blur-[100px]" />

          {/* language toggle */}
          <motion.div variants={fadeIn} className="absolute top-6 end-6 z-10">
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="rounded-full border border-brand-gold/50 bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-brand-goldLight backdrop-blur transition-colors hover:bg-brand-gold/20"
            >
              {c.toggleLabel}
            </button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={0}
            className="ornament text-xs uppercase tracking-[0.5em] text-brand-goldLight"
          >
            {lang === "ar" ? "قصتنا" : "Our Story"}
          </motion.p>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className={`mt-6 ${c.displayClass} text-5xl leading-[1.1] text-white md:text-8xl`}
          >
            {c.heroName}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className={`mt-5 ${c.displayClass} text-xl font-light tracking-wide text-brand-goldLight md:text-3xl`}
          >
            {c.heroSub}
          </motion.p>

          <motion.span
            variants={fadeUp}
            custom={3}
            className="mt-10 block divider-gold"
          />
        </section>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="container-luxury pb-32 pt-4">
          <div className="mx-auto max-w-3xl">

            {/* Story P1 */}
            <motion.p
              variants={fadeUp}
              viewport={{ once: true, amount: 0.3 }}
              whileInView="visible"
              initial="hidden"
              className={`${c.fontClass} text-xl leading-[2] text-white/80 md:text-2xl`}
            >
              {c.p1}
            </motion.p>

            {/* Hadith */}
            <motion.div
              variants={fadeUp}
              viewport={{ once: true, amount: 0.3 }}
              whileInView="visible"
              initial="hidden"
              className="my-20 text-center"
            >
              <div className="relative mx-auto inline-block max-w-2xl">
                {/* decorative lines */}
                <span className="mb-6 block divider-gold" />
                <blockquote>
                  <p className={`${c.displayClass} text-3xl font-semibold leading-[1.55] text-brand-gold md:text-5xl`}>
                    {c.hadith}
                  </p>
                  <footer className="mt-6 font-serif text-sm uppercase tracking-[0.4em] text-brand-goldLight/80">
                    {c.hadithSrc}
                  </footer>
                </blockquote>
                <span className="mt-6 block divider-gold" />
              </div>
            </motion.div>

            {/* Story P2 */}
            <motion.div
              variants={fadeUp}
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
              initial="hidden"
            >
              {c.p2.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className={`${c.fontClass} mb-7 text-xl leading-[2] text-white/80 md:text-2xl`}
                >
                  {para}
                </p>
              ))}
            </motion.div>
          </div>

          {/* Values cards */}
          <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.values.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                custom={i}
                viewport={{ once: true, amount: 0.2 }}
                whileInView="visible"
                initial="hidden"
                className="card-luxury flex flex-col gap-4"
              >
                <span className="text-4xl">{v.icon}</span>
                <h3 className={`${c.displayClass} text-2xl text-white`}>{v.title}</h3>
                <p className={`${c.fontClass} text-sm leading-7 text-white/70`}>{v.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Closing */}
          <motion.div
            variants={fadeUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
            initial="hidden"
            className="mx-auto mt-24 max-w-3xl text-center"
          >
            {/* gold dot ornament */}
            <div aria-hidden className="mx-auto mb-10 flex items-center justify-center gap-4">
              <span className="h-px w-24 bg-gradient-to-r from-transparent to-brand-gold" />
              <span className="inline-block size-2 rounded-full bg-brand-gold" />
              <span className="h-px w-24 bg-gradient-to-l from-transparent to-brand-gold" />
            </div>

            <p className={`${c.fontClass} text-2xl leading-[1.9] text-white/85 md:text-3xl`}>
              {c.closing1}
            </p>

            <p className={`${c.displayClass} mt-8 text-3xl font-semibold text-white md:text-4xl`}>
              {c.closing2}
            </p>

            <p className={`${c.displayClass} mt-10 text-xl font-light tracking-wide text-brand-goldLight md:text-2xl`}>
              {c.closingTag}
            </p>

            <div aria-hidden className="mx-auto mt-10 flex items-center justify-center gap-4">
              <span className="h-px w-24 bg-gradient-to-r from-transparent to-brand-gold" />
              <span className="inline-block size-2 rounded-full bg-brand-gold" />
              <span className="h-px w-24 bg-gradient-to-l from-transparent to-brand-gold" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
