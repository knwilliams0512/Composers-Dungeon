import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark cathedral / ancient library palette.
        //
        // Candlelit, not unlit. The surfaces carry a little more blue and a
        // little more light than they used to: at the old values a card and
        // the page behind it were nearly the same near-black, so the layout
        // had no depth and every accent on top of it read as muted.
        abyss: {
          950: "#07060d",
          900: "#0e0b1a",
          850: "#151228",
          800: "#1c1733",
          700: "#292144",
          600: "#382d5a",
        },
        gold: {
          100: "#fdf7e6",
          200: "#f9eecd",
          300: "#f5e0a3",
          400: "#edcd7a",
          500: "#d9b757",
          600: "#b59240",
          700: "#886a2c",
          800: "#5e491e",
          900: "#382b12",
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
        // The accents each gained roughly a step of saturation and light at
        // 300–500, where nearly every icon, meter and pill lives. The deep
        // steps are left alone: they are the shadows the bright work sits in.
        crimson: {
          300: "#f09a94",
          400: "#d9615a",
          500: "#b8443f",
          600: "#8d312e",
          700: "#652221",
          800: "#431616",
        },
        arcane: {
          200: "#d5dffa",
          300: "#aec3f5",
          400: "#8098e4",
          500: "#5a72c4",
          600: "#41529a",
          700: "#2e3b70",
          800: "#1d264a",
        },
        emerald2: {
          300: "#9ff0cb",
          400: "#57d9a9",
          500: "#35b88c",
          600: "#23795c",
          700: "#185744",
        },
        amethyst: {
          300: "#ddbcfb",
          400: "#c28ef5",
          500: "#a466dd",
          600: "#7d49b2",
          700: "#5a3382",
        },
        teal: {
          300: "#9eeced",
          400: "#58d2d7",
          500: "#35aab4",
          600: "#277d85",
          700: "#1d5a60",
        },
        rose: {
          300: "#f9c3d3",
          400: "#f292b0",
          500: "#e0608f",
          600: "#ae446d",
          700: "#7f3251",
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
