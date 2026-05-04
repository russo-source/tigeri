import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#040273",
          dark: "#030252",
          darker: "#020141",
        },
        surface: {
          light: "#f8f9fa",
          blue: "#f0f4f8",
        },
        ts: {
          border: "#e5e7eb",
          text: "#111827",
          "text-secondary": "#6b7280",
          "text-tertiary": "#9ca3af",
          success: "#059669",
          warning: "#d97706",
          error: "#dc2626",
          info: "#0284c7",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"IBM Plex Mono"', '"SF Mono"', "Consolas", "monospace"],
      },
      borderRadius: { sm: "2px", md: "4px" },
      transitionDuration: { fast: "150ms" },
    },
  },
  plugins: [],
};

export default config;
