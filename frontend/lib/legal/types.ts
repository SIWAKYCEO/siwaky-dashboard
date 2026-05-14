import type { Locale } from "@/i18n";

export type LegalSlug = "privacy" | "terms" | "shipping" | "returns";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  /** Shown under the title — e.g. "Last updated: May 2026" */
  updatedLine: string;
  intro?: string;
  sections: LegalSection[];
}

export type LegalCatalog = Record<Locale, Record<LegalSlug, LegalDocument>>;
