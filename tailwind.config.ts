import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#12101a",
          raised: "#1c1826",
          border: "#3d3550",
        },
        accent: {
          DEFAULT: "#ff5c8a",
          hover: "#ff7aa3",
          muted: "#e84a76",
          warm: "#ffb347",
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
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        diceShake: {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-14deg) scale(1.04)" },
          "75%": { transform: "rotate(14deg) scale(1.04)" },
        },
      },
      animation: {
        "dice-shake": "diceShake 0.12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
