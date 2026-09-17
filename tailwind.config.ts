import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#1d1d1f",
          raised: "#2c2c2e",
          border: "rgba(255, 255, 255, 0.12)",
        },
        accent: {
          DEFAULT: "#d4849a",
          hover: "#e09aad",
          muted: "#c07288",
          warm: "#ddb08a",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic UI",
          "Meiryo",
          "sans-serif",
        ],
        display: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic UI",
          "Meiryo",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
