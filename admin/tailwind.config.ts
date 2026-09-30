import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#0f3738",
          hover: "#1a4b4c",
          subtle: "#dceeed",
        },
        canvas: "#ecf5f4",
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f4f8f8",
          hover: "#e7f0ef",
        },
        ink: {
          primary: "#132b2b",
          secondary: "#5c7676",
          muted: "#8fa8a7",
        },
        card: {
          lime: "#cde9a7",
          "lime-ink": "#3d5419",
          teal: "#a9e4de",
          "teal-ink": "#1b544e",
          pink: "#f8c0c8",
          "pink-ink": "#6b232e",
          purple: "#c3d2fc",
          "purple-ink": "#283b75",
        },
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 55, 56, 0.03)",
        sm: "0 2px 6px rgba(15, 55, 56, 0.04)",
        md: "0 6px 16px rgba(15, 55, 56, 0.05)",
        lg: "0 10px 24px rgba(15, 55, 56, 0.06)",
        xl: "0 20px 32px rgba(15, 55, 56, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
