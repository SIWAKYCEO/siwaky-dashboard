import { productSchema } from "@/lib/seo/jsonld";

export default function ProductJsonLd({ locale }: { locale: string }) {
  const json = JSON.stringify(productSchema(locale));
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
