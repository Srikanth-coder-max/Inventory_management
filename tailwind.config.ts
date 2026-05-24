import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50: "hsl(230, 100%, 97%)",
          100: "hsl(228, 96%, 93%)",
          200: "hsl(228, 94%, 87%)",
          300: "hsl(226, 90%, 77%)",
          400: "hsl(224, 85%, 65%)",
          500: "hsl(222, 80%, 55%)",
          600: "hsl(220, 78%, 47%)",
          700: "hsl(218, 78%, 39%)",
          800: "hsl(216, 74%, 32%)",
          900: "hsl(214, 68%, 26%)",
          950: "hsl(212, 72%, 15%)",
        },
        surface: {
          50: "hsl(220, 20%, 98%)",
          100: "hsl(220, 16%, 96%)",
          200: "hsl(220, 14%, 92%)",
          800: "hsl(222, 20%, 12%)",
          900: "hsl(222, 24%, 8%)",
          950: "hsl(224, 28%, 5%)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
