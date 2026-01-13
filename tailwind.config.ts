import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Primary brand color (blue)
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        // Status colors with semantic meaning
        status: {
          verified: {
            bg: "#dcfce7",
            text: "#166534",
            border: "#86efac",
          },
          processing: {
            bg: "#dbeafe",
            text: "#1e40af",
            border: "#93c5fd",
          },
          connected: {
            bg: "#cffafe",
            text: "#0e7490",
            border: "#67e8f9",
          },
          configured: {
            bg: "#f3f4f6",
            text: "#374151",
            border: "#d1d5db",
          },
          degraded: {
            bg: "#fef3c7",
            text: "#92400e",
            border: "#fcd34d",
          },
          error: {
            bg: "#fee2e2",
            text: "#991b1b",
            border: "#fca5a5",
          },
        },
        // Neutral grays for text hierarchy
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      // Typography scale (Stripe/Vercel inspired)
      fontSize: {
        // Headings
        "display-2xl": ["2.75rem", { lineHeight: "1.08", letterSpacing: "-0.03em" }], // 44px
        "display-xl": ["2.375rem", { lineHeight: "1.12", letterSpacing: "-0.02em" }], // 38px
        "display-lg": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }], // 32px
        "display-md": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.015em" }], // 24px
        "display-sm": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }], // 20px
        "display-xs": ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }], // 18px
        // Numbers / metrics
        "metric-lg": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }], // 32px
        "metric-md": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }], // 24px
        // Body
        "body-xl": ["1.0625rem", { lineHeight: "1.7" }], // 17px
        "body-lg": ["1rem", { lineHeight: "1.7" }], // 16px
        "body-md": ["0.9375rem", { lineHeight: "1.65" }], // 15px
        "body-sm": ["0.875rem", { lineHeight: "1.6" }], // 14px
        "body-xs": ["0.8125rem", { lineHeight: "1.55" }], // 13px
        "label": ["0.75rem", { lineHeight: "1", letterSpacing: "0.05em" }],
      },
      // Spacing scale
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      // Border radius
      borderRadius: {
        "4xl": "2rem",
      },
      // Box shadows (subtle depth)
      boxShadow: {
        "subtle": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "elevated": "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)",
      },
      // Animation
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-subtle": "pulseSubtle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      // Max widths for containers
      maxWidth: {
        "8xl": "88rem",
        "prose-wide": "75ch",
      },
    },
  },
  plugins: [],
} satisfies Config;
