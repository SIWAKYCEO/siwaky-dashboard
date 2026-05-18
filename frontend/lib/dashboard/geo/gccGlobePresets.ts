/** Camera / orbit targets (legacy 3D) + 2D map view bounds (operations map). */
export type GlobeFocusPreset =
  | "world"
  | "gcc"
  | "SA"
  | "AE"
  | "QA"
  | "KW"
  | "BH"
  | "OM";

export type MapBounds = { south: number; north: number; west: number; east: number };

/** WGS84 bounds for 2D live map — zoom targets per region. */
export const GCC_MAP_VIEW_PRESETS: Record<GlobeFocusPreset, MapBounds> = {
  world: { south: 14.2, north: 34, west: 33, east: 62 },
  gcc: { south: 15.8, north: 32.6, west: 34.4, east: 59.9 },
  SA: { south: 16, north: 32.5, west: 34.5, east: 56 },
  AE: { south: 22.4, north: 27.3, west: 51.2, east: 56.9 },
  QA: { south: 24.3, north: 26.5, west: 50.5, east: 52.6 },
  KW: { south: 28.4, north: 30.5, west: 46.0, east: 49.0 },
  BH: { south: 25.75, north: 26.55, west: 50.2, east: 50.95 },
  OM: { south: 16.2, north: 26.8, west: 52.0, east: 60 },
};

/** Full canvas extent for projection (must contain all {@link GCC_MAP_VIEW_PRESETS}). */
export const GCC_MAP_FULL_EXTENT: MapBounds = {
  south: 12,
  north: 37,
  west: 31.5,
  east: 64.5,
};

export type GlobeFocusConfig = {
  lat: number;
  lng: number;
  /** Camera distance from origin; smaller = closer “zoom”. */
  dist: number;
  short: string;
  label: string;
};

export const GCC_GLOBE_PRESETS: Record<GlobeFocusPreset, GlobeFocusConfig> = {
  /** Framed “command center” overview — Arabian Peninsula biased. */
  world: { lat: 21, lng: 48, dist: 5.32, short: "World", label: "World" },
  /** Tight Gulf arc for multi-country context. */
  gcc: { lat: 24.35, lng: 47.75, dist: 1.86, short: "GCC", label: "GCC" },
  SA: { lat: 24.65, lng: 46.35, dist: 1.68, short: "SA", label: "Saudi Arabia" },
  AE: { lat: 24.35, lng: 54.45, dist: 1.78, short: "UAE", label: "United Arab Emirates" },
  QA: { lat: 25.29, lng: 51.53, dist: 1.88, short: "QA", label: "Qatar" },
  KW: { lat: 29.38, lng: 47.97, dist: 1.9, short: "KW", label: "Kuwait" },
  BH: { lat: 26.07, lng: 50.56, dist: 1.52, short: "BH", label: "Bahrain" },
  OM: { lat: 22.85, lng: 57.1, dist: 1.84, short: "OM", label: "Oman" },
};

export const GCC_GLOBE_FOCUS_ORDER: GlobeFocusPreset[] = [
  "world",
  "gcc",
  "SA",
  "AE",
  "QA",
  "KW",
  "BH",
  "OM",
];
