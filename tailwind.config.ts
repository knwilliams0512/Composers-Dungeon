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
          100: "#fdf7e6",
          200: "#f8ebc6",
          300: "#f0d894",
          400: "#e3c26d",
          500: "#c9a84c",
          600: "#a8863a",
          700: "#7d6229",
          800: "#57431c",
          900: "#332711",
        },
        parchment: {
          100: "#f5ecd7",
          200: "#e9dcc0",
          300: "#d6c5a0",
          // 400 and 500 carry most of the secondary text in the app. Against a
          // near-black ground the old values sat close to the contrast floor at
          // the 10px sizes the labels use, which is most of why the interface
          // read as flat and grey.
          400: "#c0ad88",
          500: "#a08e6b",
          // 600 and 700 were used throughout the app but never defined, so
          // those classes generated nothing and the text simply inherited.
          600: "#7f7052",
          700: "#5f5340",
        },
        crimson: {
          300: "#dc8580",
          400: "#c2554f",
          500: "#a03c38",
          600: "#7e2b29",
          700: "#5c1e1d",
          800: "#3d1414",
        },
        arcane: {
          200: "#c6d2f2",
          300: "#9fb4e8",
          400: "#7289d1",
          500: "#4f63a8",
          600: "#3a4a82",
          700: "#2a365f",
          800: "#1b2340",
        },
        emerald2: {
          300: "#8fe0bc",
          400: "#4dc79a",
          500: "#2fa27c",
          600: "#1f6b52",
          700: "#164e3c",
        },
        amethyst: {
          300: "#d3aef5",
          400: "#b47fe6",
          500: "#9358c9",
          600: "#7140a0",
          700: "#502d73",
        },
        teal: {
          300: "#8fdde0",
          400: "#4fbfc4",
          500: "#2f97a0",
          600: "#236e75",
          700: "#1a4f54",
        },
        rose: {
          300: "#f3b6c9",
          400: "#e685a3",
          500: "#cc5580",
          600: "#9c3c61",
          700: "#712c48",
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
    },
  },
  plugins: [],
};

export default config;
