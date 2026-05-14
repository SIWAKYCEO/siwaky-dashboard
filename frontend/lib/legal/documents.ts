import type { Locale } from "@/i18n";
import type { LegalCatalog, LegalDocument, LegalSlug } from "@/lib/legal/types";

/** Bilingual SIWAKY legal copies — synced with storefront locales. */
export const LEGAL_DOCUMENTS: LegalCatalog = {
  ar: {
    privacy: {
      title: "سياسة الخصوصية",
      updatedLine: "آخر تحديث: مايو 2026",
      intro:
        "تحترم شركة EMYRA LTD (المملكة المتحدة) وفريق سواكي خصوصيتك. توضّح هذه السياسة كيفية جمع واستخدام المعلومات عند تصفّح المتجر أو تقديم طلب عبر سواكي.",
      sections: [
        {
          heading: "البيانات التي قد نجمعها",
          bullets: [
            "الاسم الكامل وفقاً ما يُدخل عند تأكيد الطلب.",
            "رقم الهاتف (للاتصال بتأكيد الطلب وتنسيق التوصيل).",
            "المدينة أو المنطقة ضمن المملكة العربية السعودية (لتحديد مناطق التحصيل والتوصيل).",
            "عنوان IP والمعلومات الفنية المتعلقة بالجهاز والمتصفح (لدواعي الأمان وتحسين الأداء ومنع الإساءة).",
          ],
        },
        {
          heading: "كيف نستخدم بياناتك",
          bullets: [
            "معالجة الطلب وتأكيده والتواصل معك بخصوص حالة الطلب والتوصيل.",
            "تنسيق الشحن إلى عنوانك أو نقطة استلام المناسبة داخل المملكة.",
            "خدمة العملاء والرد على استفساراتك المتعلقة بالمنتج أو الطلب.",
            "تحليل تقني مجهول الهوية قدر الإمكان لتحسين تجربة الموقع وحمايته.",
          ],
        },
        {
          heading: "عدم بيع البيانات لجهات خارجية",
          paragraphs: [
            "لا نقوم ببيع بياناتك الشخصية لأي طرف ثالث تسويقي. قد نشارك الحدّ الأدنى من المعلومات مع شركاء لوجستيين معتمدين فقط لتنفيذ التوصيل، أو حيث يقتضي القانون ذلك.",
          ],
        },
        {
          heading: "ملفات تعريف الارتباط وبكسل الإعلانات",
          paragraphs: [
            "قد يستخدم موقع سواكي ملفات تعريف الارتباط وتقنيات مشابهة لتحسين الأداء وقياس فعالية الحملات. قد نقوم بتشغيل بكسل تجاري من منصات مثل Meta (فيسبوك وإنستغرام)، وتيك توك وسناب شات لفهم عدد الزيارات والإحالات وفق سياسات تلك المنصات.",
            "يمكنك ضبط ملفات الارتباط من إعدادات متصفحك؛ قد يؤثر ذلك في بعض الوظائف.",
          ],
        },
        {
          heading: "الاحتفاظ بالبيانات",
          paragraphs: [
            "نحتفظ ببيانات الطلبات لفترات تتوافق مع متطلبات المحاسبة وخدمة العملاء وحل المنازعات، ثم نقوم بتقييد الوصول أو حذف أو إخفاء هوية ما لا نعدّه ضرورياً للعمل التشغيلي.",
          ],
        },
        {
          heading: "التواصل والشركة القانونية",
          paragraphs: [
            "للاستفسارات المتعلقة بالخصوصية أو ممارسة حقوقك: siwaky.assistance@gmail.com.",
            "الجهة القانونية: EMYRA LTD — المملكة المتحدة. العلامة التجارية: سواكي.",
          ],
        },
      ],
    },
    terms: {
      title: "شروط الاستخدام",
      updatedLine: "آخر تحديث: مايو 2026",
      intro:
        "بتصفّحك لموقع سواكي وتقديمك لطلب، فإنك توافق على الشروط التالية أمام شركة EMYRA LTD، المُسجّلة في المملكة المتحدة وتشغّل علامة سواكي.",
      sections: [
        {
          heading: "طرق الدفع",
          bullets: ["الشراء يتم حالياً عبر الدفع نقداً عند الاستلام (COD) فقط، ما لم يُعلَن خلاف ذلك صراحة على الموقع."],
        },
        {
          heading: "الشحن والتسليم",
          bullets: [
            "التسليم داخل جميع أنحاء المملكة العربية السعودية حسب عنوانك.",
            "المدّة المتوقعة عادة بين 1–4 أيام عمل، دون احتساب أيام الطلبات أو العطل الرسمية.",
          ],
        },
        {
          heading: "الإرجاع واسترداد القيمة",
          paragraphs: [
            "لا تُعتبر هذه الفقرة بديلاً عن صفحة «سياسة الإرجاع» التفصيلية؛ وفق المعايير المذكورة هناك يُعاد المبلغ عند الموافقة على الإرجاع المؤهل وفق الآليات المعتادة.",
          ],
        },
        {
          heading: "أصالة المنتج وجودته",
          paragraphs: ["نلتزم بتوريد منتجات سواكي الأصلية المغلَّفة وفق المواصفات المعروضة، دون تشويه أو ادعاء علاجي."],
        },
        {
          heading: "الحلال",
          bullets: ["المنتج حاصل على شهادة حلال عالمية من جهة موثَّقة وفق المنشور على الموقع وبيانات الشهادة."],
        },
        {
          heading: "إلغاء الطلب",
          paragraphs: [
            "في حالات معقولة ومبكرة قبل تجهيز الشحنة أو تسليمها للوجستيات، يُرجى التواصل فوراً مع الدعم لمعرفة ما إذا كان لا يزال الإلغاء ممكناً. بعد تسليم الشحنة لمندوب الطرف الثالث، قد تُطبَّق سياسات الإرجاع.",
          ],
        },
        {
          heading: "القانون الواجب التطبيق",
          paragraphs: [
            "تخضع هذه الشروط وعلاقاتك التعاقدية مع EMYRA LTD لقوانين المملكة المتحدة حيثما لا يوجد تنازل إلزامي لمستهلك وفق تشريعات المحل الذي تُنشأ فيه العلاقة.",
          ],
        },
      ],
    },
    shipping: {
      title: "سياسة الشحن والتوصيل",
      updatedLine: "آخر تحديث: مايو 2026",
      intro:
        "نسعى لتجربة توصيل واضحة وموثوقة لعملائنا في المملكة العربية السعودية. تُكمِّل هذه الصفحة المعلومات المعروضة عند تأكيد الطلب.",
      sections: [
        {
          heading: "مناطق التوصيل",
          bullets: ["نغطّي جهات وأقاليم المملكة العربية السعودية عبر شبكة شحن مناسبة."],
        },
        {
          heading: "مدة التوصيل",
          bullets: ["عادة بين 1–4 أيام عمل من تأكيد الطلب وحتى التسليم، مع مراعاة العطل المحلية وضغط الموسم."],
        },
        {
          heading: "التكلفة",
          bullets: ["التوصيل مجاني ضمن هذا النموذج الحالي لتجربة العميل — ما لم يُعلَن مستقبلاً عن رسوم مختلفة بحملة أو منطقة خاصة."],
        },
        {
          heading: "الدفع والتأكيد",
          bullets: [
            "الدفع نقداً عند الاستلام فقط؛ لا مطالبة بتسديد مسبق بطاقة ائتمان عبر المتجر لهذا الطراز.",
          ],
        },
        {
          heading: "تتبع الطلب والاتصالات",
          paragraphs: [
            "قد يكون التتبع عبر تأكيد سريالي برسالة أو اتصال هاتفي من الفريق لمطابقة التفاصيل قبل أو أثناء التسليم وفق ظروف المشغّل ولوجستيات الطرف الثالث.",
          ],
        },
      ],
    },
    returns: {
      title: "سياسة الإرجاع والاستبدال",
      updatedLine: "آخر تحديث: مايو 2026",
      intro:
        "نريد تجربة عادلة ومسؤولة؛ تُقيَّم كل حالة وفق هذا الإطار. للبدء بالإرجاع، يُرجى مراسلة خدمة العملاء عبر البريد المعتمد.",
      sections: [
        {
          heading: "المدّة الزمنية",
          bullets: ["يُمكن طلب إرجاع مؤهل خلال 7 أيام من استلام الطرد، ما لم تنطبق أي استثناءات قانونية أخرى."],
        },
        {
          heading: "حالة المنتج",
          bullets: [
            "يجب أن يكون المنتج مغلَّقاً وغير مفتوح وفي عبوته وتغليفه الأصلي دون تشويه تُعزى لسوء استخدام المتسوق بعد التسليم.",
          ],
        },
        {
          heading: "آلية البدء بالإرجاع",
          paragraphs: [
            "تواصل مع خدمة العملاء عبر siwaky.assistance@gmail.com مع ذكر اسمك، ورقم الهاتف، وملاحظة مختصرة؛ سيُحدّد موعد الإجراء والمتابعة.",
          ],
        },
        {
          heading: "الاسترداد",
          bullets: [
            "بعد فحص الاستلام وثبوت الطلب وفق هذه الشروط، يُستخدم أسلوب تعويض آمن وفق المتاح لدينا (مثلاً عكس على معاملة COD أو ائتمت لاحقة كما تناسب آلية شركة الدفع ومشغل اللوجستيات).",
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy policy",
      updatedLine: "Last updated: May 2026",
      intro:
        "EMYRA LTD (United Kingdom), operator of SIWAKY, respects your privacy. This policy explains how we collect and use personal information when you browse our store or place an order.",
      sections: [
        {
          heading: "Information we collect",
          bullets: [
            "Full name as entered during order confirmation.",
            "Phone number (to confirm orders and coordinate delivery).",
            "City or region within Saudi Arabia (for delivery feasibility and courier routing).",
            "IP address and basic device/browser information for security, fraud prevention, and performance optimisation.",
          ],
        },
        {
          heading: "How we use your data",
          bullets: [
            "Process, confirm, and communicate about orders and shipments.",
            "Coordinate delivery partners across KSA.",
            "Provide customer support for product or order enquiries.",
            "Aggregate analytics where feasible to operate and safeguard the storefront.",
          ],
        },
        {
          heading: "We do not sell your data",
          paragraphs: [
            "We do not sell personal information to advertisers. We share only what is minimally necessary with courier partners executing delivery, or where the law obliges us.",
          ],
        },
        {
          heading: "Cookies and advertising pixels",
          paragraphs: [
            "SIWAKY may use cookies and similar technologies together with Meta (Facebook / Instagram), TikTok, and Snapchat measurement pixels subject to those platforms’ terms. Adjust cookie settings via your browser; some features might change.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "We retain transactional records aligned with bookkeeping, fulfilment audits, disputes, then restrict access or delete where no legitimate business need persists.",
          ],
        },
        {
          heading: "Contact & legal entity",
          paragraphs: ["Privacy requests: siwaky.assistance@gmail.com.", "Trading brand: SIWAKY · Entity: EMYRA LTD · United Kingdom."],
        },
      ],
    },
    terms: {
      title: "Terms of use",
      updatedLine: "Last updated: May 2026",
      intro:
        "Using siwaky.com and submitting an order means you agree to these terms offered by EMYRA LTD (UK), which operates the SIWAKY brand.",
      sections: [
        {
          heading: "Cash-on-delivery (COD) payments",
          bullets: ["Payment is COD only unless we explicitly advertise another method on-site."],
        },
        {
          heading: "Delivery",
          bullets: ["Saudi Arabia-wide coverage with an indicative 1–4 business-day window after confirmation, excluding Fridays/holidays and force majeure."],
        },
        {
          heading: "Returns & refunds",
          paragraphs: ["Return eligibility follows the standalone Returns Policy; authorised refunds settle through the COD workflow described there."],
        },
        {
          heading: "Product authenticity",
          paragraphs: ["We supply genuine SIWAKY boxed goods as marketed; SIWAKY is not marketed as medicine or a therapeutic device."],
        },
        {
          heading: "Halal certification",
          bullets: ["Product halal posture is evidenced by certificates referenced on-site (International Halal Certification)."],
        },
        {
          heading: "Cancellation",
          paragraphs: [
            "Contact assistance immediately before dispatch; once handed to courier partners cancellations may revert to returns procedures.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: ["These terms are governed by the laws applicable to EMYRA LTD in the UK, without prejudice to Saudi consumer-protection rules that must apply."],
        },
      ],
    },
    shipping: {
      title: "Shipping & delivery policy",
      updatedLine: "Last updated: May 2026",
      intro: "Straightforward shipping rules for SIWAKY customers in Saudi Arabia.",
      sections: [
        {
          heading: "Areas served",
          bullets: ["Nationwide fulfilment covering all provinces of Saudi Arabia subject to courier coverage."],
        },
        {
          heading: "Timelines",
          bullets: ["Target delivery roughly 1–4 business days from confirmation; seasonal peaks may extend slightly."],
        },
        {
          heading: "Free shipping",
          bullets: ["Current commercial model includes complementary delivery with no separate shipping fee charged at checkout unless special campaigns dictate otherwise."],
        },
        {
          heading: "COD only · no prepaid card flow",
          bullets: ["We do not require card prepayment via the storefront for the standard SKU configuration — cash on delivery at handover."],
        },
        {
          heading: "Order updates",
          paragraphs: [
            "You may receive a phone call/SMS confirming details plus tracking checkpoints via our courier partner when available.",
          ],
        },
      ],
    },
    returns: {
      title: "Returns & exchanges policy",
      updatedLine: "Last updated: May 2026",
      intro: "We review each request responsibly. Reach out via the official inbox to start a compliant return.",
      sections: [
        {
          heading: "7-day window",
          bullets: ["Initiate qualifying returns within 7 days of courier delivery acknowledgement."],
        },
        {
          heading: "Unopened merchandise",
          bullets: ["Returned units must remain factory sealed, untouched, inside original SIWAKY packaging suitable for resale."],
        },
        {
          heading: "How to initiate",
          paragraphs: ["Email siwaky.assistance@gmail.com with your name, phone, proof of delivery if available; our team assigns next steps."],
        },
        {
          heading: "Refund handling",
          bullets: ["After QC approval in our warehouse/partner hubs, COD reversals/credits follow the workable partner settlement schedule."],
        },
      ],
    },
  },
};

export function getLegalDocument(locale: string, slug: LegalSlug): LegalDocument {
  const loc: Locale = locale === "en" ? "en" : "ar";
  return LEGAL_DOCUMENTS[loc][slug];
}
