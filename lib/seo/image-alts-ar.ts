/** Arabic `alt` text for images (primary market / SEO brief). */

export const IMAGE_ALT_AR = {
  logo: "شعار سواكي — سواك طبيعي فاخر معتمد حلال",
  hero: "علبة سواكي الفاخرة على خلفية فاخرة — سواك طبيعي معتمد حلال للسعودية والخليج",
  productShowcase: "علبة سواكي الفاخرة بأربع نكهات طبيعية — نعناع، قرنفل، جوز الهند، طبيعي",
  story: "تفاصيل قرب من سواك طبيعي سواكي فاخر في علبة أنيقة",
  ctaBg: "خلفية دعوة لطلب سواكي — سواك طبيعي فاخر معتمد حلال",
  cartThumb: "صورة مصغّرة لمنتج سواكي في سلة التسوق",
  flavorPrefix: "نكهة",
} as const;

export function productGalleryAlt(index: number): string {
  return `صورة ${index + 1} لعلبة سواكي الفاخرة — سواك طبيعي بأربع نكهات`;
}
