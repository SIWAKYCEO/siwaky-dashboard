import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          black: "#000000",
          dark: "#28282A",
          dark2: "#1A1A1A",
          offwhite: "#F8F6F0",
          white: "#FFFFFF",
          gold: "#C9A84C",
          goldLight: "#F0DFA0",
          goldDark: "#A07830",
          danger: "#DC2626",
        },
        siwaky: {
          canvas: "#28282a",
          elevated: "#2e2e31",
          line: "rgba(255, 255, 255, 0.08)",
          muted: "rgba(255, 255, 255, 0.52)",
          gold: "#c9a962",
          goldSoft: "#d4bf8a",
        },
      },
      fontFamily: {
        display: ["var(--font-scheherazade)", "serif"],
        naskh: ["var(--font-naskh)", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-naskh)", "system-ui", "sans-serif"],
        dashSans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        dashDisplay: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 30px -10px rgba(201,168,76,0.6)",
        goldStrong: "0 0 40px -8px rgba(201,168,76,0.9)",
        glass:
          "0 0 0 1px rgba(255,255,255,0.06), 0 4px 26px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        glassLg:
          "0 0 0 1px rgba(255,255,255,0.07), 0 22px 60px -18px rgba(0,0,0,0.68), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        "siwaky-bg":
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 32%), radial-gradient(1000px ellipse at 85% -20%, rgba(201,169,98,0.11), transparent 55%), radial-gradient(900px circle at -10% 120%, rgba(99,146,227,0.07), transparent 45%)",
        "lux-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(1200px ellipse at 20% -30%, rgba(201,169,98,0.12), transparent 50%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        dashGlow: {
          "0%,100%": { opacity: "0.45", filter: "blur(8px)" },
          "50%": { opacity: "0.9", filter: "blur(12px)" },
        },
        dashScan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        globeHudShimmer: {
          "0%": { transform: "translateX(-120%)", opacity: "0" },
          "18%": { opacity: "0.55" },
          "100%": { transform: "translateX(120%)", opacity: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        dashGlow: "dashGlow 4s ease-in-out infinite",
        dashScan: "dashScan 2.8s ease-in-out infinite",
        "globe-hud-shimmer": "globeHudShimmer 4.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
