import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand v2 primary action
        tigerscale: {
          DEFAULT: "#3537D7",
          hover: "#2A2BB0",
        },
        // Deep Navy — anchor, kept for backward compat with existing components
        navy: {
          DEFAULT: "#040273",
          dark: "#030252",
          darker: "#020141",
        },
        cyan: "#55ADE5",
        violet: "#6764CF",
        teal: "#1AA9A4",
        // Neutral ink ramp
        ink: {
          50: "#EBF0F7",
          100: "#F0F4F8",
          200: "#DCE6F4",
          300: "#9AB6DD",
          400: "#7178C2",
          500: "#4F4F9B",
          600: "#2F397A",
          700: "#1F235A",
          800: "#14143F",
          900: "#0A0A27",
          1000: "#02010B",
        },
        // Legacy tokens retained so untouched components never lose styling
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
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        pill: "20px",
      },
      backgroundImage: {
        "gradient-flywheel":
          "linear-gradient(135deg, #3537D7 0%, #55ADE5 50%, #1AA9A4 100%)",
      },
      transitionDuration: { fast: "150ms" },
    },
  },
  plugins: [],
};

export default config;
