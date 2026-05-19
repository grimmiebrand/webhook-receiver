import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d6d6dc",
          300: "#b1b1ba",
          400: "#83838f",
          500: "#5a5a66",
          600: "#3f3f48",
          700: "#2a2a31",
          800: "#1a1a1f",
          900: "#0d0d10",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
