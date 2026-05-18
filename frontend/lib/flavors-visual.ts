/** Shared flavor imagery (same paths as homepage `FlavorsSection`). */
export const FLAVOR_VISUALS = [
  { key: "natural", img: "/images/flavors/natural.png", tint: "from-emerald-700/30 to-emerald-900/10" },
  { key: "mint", img: "/images/flavors/mint.png", tint: "from-teal-700/30 to-teal-900/10" },
  { key: "clove", img: "/images/flavors/clove.png", tint: "from-amber-800/30 to-orange-900/10" },
  { key: "coconut", img: "/images/flavors/coconut.png", tint: "from-stone-500/20 to-stone-800/10" },
] as const;

export type FlavorVisualKey = (typeof FLAVOR_VISUALS)[number]["key"];

const visualByKey = Object.fromEntries(FLAVOR_VISUALS.map((v) => [v.key, v])) as Record<
  FlavorVisualKey,
  (typeof FLAVOR_VISUALS)[number]
>;

export function getFlavorVisual(key: string): (typeof FLAVOR_VISUALS)[number] | undefined {
  return visualByKey[key as FlavorVisualKey];
}
