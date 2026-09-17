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
          DEFAULT: "#12101a",
          raised: "#1c1826",
          border: "#3d3550",
        },
        accent: {
          DEFAULT: "#d4849a",
          hover: "#e09aad",
          muted: "#c07288",
          warm: "#ddb08a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Hiragino Maru Gothic ProN", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Hiragino Maru Gothic ProN", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
