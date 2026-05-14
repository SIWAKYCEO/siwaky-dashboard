import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n";

/** Shop lives under `[locale]` — bare `/` must not 404. */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
