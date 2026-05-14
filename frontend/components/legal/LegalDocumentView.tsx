import Link from "next/link";

import type { LegalDocument } from "@/lib/legal/types";

import Logo from "@/components/shared/Logo";
import GoldOrnamentalDivider from "@/components/shared/GoldOrnamentalDivider";

interface Props {
  locale: string;
  doc: LegalDocument;
}

/** Premium dark legal layout — honours parent `dir`/`lang` from `[locale]` layout. */
export default function LegalDocumentView({ locale, doc }: Props) {
  return (
    <div className="min-h-[70vh] bg-brand-dark">
      <article className="container-luxury mx-auto max-w-3xl pb-24 pt-14 md:pt-20">
        <header className="flex flex-col items-center text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex rounded-xl outline-none ring-offset-2 ring-offset-brand-dark focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          >
            <Logo size="lg" className="justify-center" />
          </Link>

          <div className="mt-10 w-full max-w-md">
            <GoldOrnamentalDivider />
          </div>

          <h1 className="mt-10 font-display text-3xl leading-tight text-white md:text-5xl">{doc.title}</h1>

          <p className="mt-5 text-xs uppercase tracking-[0.35em] text-brand-goldLight">{doc.updatedLine}</p>

          {doc.intro ? (
            <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-white/75 md:text-lg">{doc.intro}</p>
          ) : null}
        </header>

        <div className="mt-14 space-y-14">
          {doc.sections.map((section, idx) => (
            <section key={idx} className="rounded-2xl border border-white/[0.06] bg-brand-dark2/30 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)] md:p-8">
              <GoldOrnamentalDivider className="mb-8" />
              <h2 className="font-display text-xl text-brand-goldLight md:text-2xl">{section.heading}</h2>

              {section.paragraphs?.map((p, i) => (
                <p key={i} className="mt-4 text-pretty text-[0.95rem] leading-[1.9] text-white/78 md:text-base">
                  {p}
                </p>
              ))}

              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-5 space-y-3 text-white/78">
                  {section.bullets.map((item, i) => (
                    <li key={i} className="flex gap-3 text-pretty text-[0.95rem] leading-[1.85] md:text-base">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(201,168,76,0.45)]"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
