import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n";

/** Public storefront entry — never send siwaky.com visitors to the operator dashboard. */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
