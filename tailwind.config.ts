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
      },
      fontFamily: {
        display: ["var(--font-scheherazade)", "serif"],
        naskh: ["var(--font-naskh)", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-naskh)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 30px -10px rgba(201,168,76,0.6)",
        goldStrong: "0 0 40px -8px rgba(201,168,76,0.9)",
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
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
