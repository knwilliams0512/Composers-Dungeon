import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark cathedral / ancient library palette
        abyss: {
          950: "#07060b",
          900: "#0c0a14",
          850: "#110e1c",
          800: "#171326",
          700: "#211b36",
          600: "#2d2547",
        },
        gold: {
          300: "#f0d894",
          400: "#e3c26d",
          500: "#c9a84c",
          600: "#a8863a",
          700: "#7d6229",
        },
        parchment: {
          100: "#f5ecd7",
          200: "#e9dcc0",
          300: "#d6c5a0",
          400: "#b3a07c",
          500: "#8c7a5b",
        },
        crimson: {
          400: "#c2554f",
          500: "#a03c38",
          600: "#7e2b29",
          700: "#5c1e1d",
        },
        arcane: {
          300: "#9fb4e8",
          400: "#7289d1",
          500: "#4f63a8",
          600: "#3a4a82",
          700: "#2a365f",
        },
        stone: {
          350: "#a9a29a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(201, 168, 76, 0.18)",
        "glow-strong": "0 0 40px rgba(201, 168, 76, 0.35)",
        crimson: "0 0 24px rgba(160, 60, 56, 0.35)",
        arcane: "0 0 24px rgba(79, 99, 168, 0.3)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(ellipse at top, rgba(45,37,71,0.55), transparent 65%)",
        "gold-fade":
          "radial-gradient(ellipse at top, rgba(201,168,76,0.12), transparent 60%)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.85" },
          "55%": { opacity: "0.95" },
          "70%": { opacity: "0.8" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flicker: "flicker 3s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
