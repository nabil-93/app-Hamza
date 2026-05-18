/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary palette
        mint: {
          50: "#F0FDF9",
          100: "#CCFBEF",
          200: "#99F6DF",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          primary: "#00D4A8",
          light: "#4DFFD4",
          dark: "#00A882",
        },
        teal: {
          primary: "#0891B2",
          light: "#22D3EE",
          dark: "#0E7490",
        },
        // Background
        bg: {
          primary: "#0A0E1A",
          secondary: "#111827",
          card: "#141B2D",
          glass: "rgba(20, 27, 45, 0.8)",
        },
        // Neon accents for AI chat
        neon: {
          green: "#00FF88",
          blue: "#00B4FF",
          purple: "#A855F7",
          pink: "#FF006E",
        },
        // Status colors
        danger: "#FF4444",
        warning: "#FFB800",
        success: "#00D4A8",
        // Text
        text: {
          primary: "#FFFFFF",
          secondary: "#8B9DB5",
          muted: "#4A5568",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
