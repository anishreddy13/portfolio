/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "cursive"],
        mono:    ["'DM Mono'", "monospace"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      colors: {
        /* ── Electric Studio Palette ── */
        red: {
          DEFAULT: "#FF2D2D",
          dim:     "#CC1A1A",
          glow:    "rgba(255,45,45,0.35)",
        },
        lime: {
          DEFAULT: "#C8FF00",
          dim:     "#A0CC00",
          glow:    "rgba(200,255,0,0.25)",
        },
        coral: {
          DEFAULT: "#FF6B35",
          glow:    "rgba(255,107,53,0.25)",
        },
        violet: {
          DEFAULT: "#A855F7",
          glow:    "rgba(168,85,247,0.25)",
        },
        surface: {
          0: "#0A0A0A",
          1: "#111111",
          2: "#1A1A1A",
          3: "#222222",
          4: "#2A2A2A",
        },
        text: {
          primary:   "#F0F0F0",
          secondary: "#A0A0A0",
          tertiary:  "#606060",
          inverse:   "#0A0A0A",
        },

        /* ── Legacy aliases — keeps ALL existing component classes working ── */
        void:      "#0A0A0A",
        cream:     "#F0F0F0",
        parchment: "#111111",
        stone: {
          DEFAULT: "#2A2A2A",
          dark:    "#606060",
        },
        sage: {
          light:   "#A0CC00",
          DEFAULT: "#C8FF00",
          dark:    "#A0CC00",
        },
        rose: {
          light:   "#FF9B7A",
          DEFAULT: "#FF6B35",
        },
        slate: {
          light:   "#C4B5FD",
          DEFAULT: "#A855F7",
        },
        ink: {
          faint:   "#606060",
          light:   "#A0A0A0",
          DEFAULT: "#0A0A0A",
        },
        nebula: {
          cyan:   "#C8FF00",
          purple: "#A855F7",
          blue:   "#A855F7",
          pink:   "#FF6B35",
        },
        glass: "rgba(17,17,17,0.75)",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        /* Electric mesh gradients */
        "electric-gradient":
          "linear-gradient(135deg, #FF2D2D 0%, #FF6B35 40%, #C8FF00 100%)",
        "dark-gradient":
          "linear-gradient(160deg, #0A0A0A 0%, #111111 100%)",
        "red-gradient":
          "linear-gradient(135deg, #FF2D2D 0%, #CC1A1A 100%)",
        "lime-gradient":
          "linear-gradient(135deg, #C8FF00 0%, #A0CC00 100%)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,45,45,0.15) 0%, transparent 70%)",
        /* Legacy compat */
        "paper-gradient": "linear-gradient(160deg, #111111 0%, #0A0A0A 100%)",
        "sage-gradient":  "linear-gradient(135deg, #C8FF00 0%, #A0CC00 100%)",
      },

      animation: {
        "spin-slow":    "spin 20s linear infinite",
        "pulse-slow":   "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        float:          "float 7s ease-in-out infinite",
        "float-slow":   "float 10s ease-in-out infinite",
        "fade-up":      "fadeUp 0.6s ease forwards",
        "fade-in":      "fadeIn 0.5s ease forwards",
        "slide-in-left":"slideInLeft 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in-right":"slideInRight 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        marquee:        "marquee 20s linear infinite",
        "border-spin":  "borderSpin 4s ease infinite",
        "pulse-glow":   "pulseGlow 2.5s ease-in-out infinite",
        flicker:        "flicker 6s step-end infinite",
        "mesh-shift":   "meshShift 12s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-14px)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        borderSpin: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255,45,45,0.35)" },
          "50%":      { boxShadow: "0 0 28px rgba(255,45,45,0.35), 0 0 60px rgba(255,45,45,0.12)" },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%":            { opacity: "0.85" },
          "97%":            { opacity: "1" },
          "98%":            { opacity: "0.9" },
        },
        meshShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "33%":      { backgroundPosition: "100% 0%" },
          "66%":      { backgroundPosition: "50% 100%" },
        },
      },

      boxShadow: {
        /* Electric glow shadows */
        "red-sm":    "0 0 12px rgba(255,45,45,0.3)",
        "red-md":    "0 0 24px rgba(255,45,45,0.35), 0 8px 32px rgba(255,45,45,0.15)",
        "red-lg":    "0 0 40px rgba(255,45,45,0.4), 0 16px 60px rgba(255,45,45,0.2)",
        "lime-sm":   "0 0 12px rgba(200,255,0,0.25)",
        "lime-md":   "0 0 24px rgba(200,255,0,0.3)",
        "coral-md":  "0 0 24px rgba(255,107,53,0.3)",
        "violet-md": "0 0 24px rgba(168,85,247,0.3)",
        /* Card shadows */
        "card":      "0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)",
        "card-lg":   "0 2px 8px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)",
        "card-hover":"0 2px 6px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,45,45,0.2)",
        /* Legacy compat */
        paper:       "0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)",
        "paper-lg":  "0 2px 8px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)",
        "ink-sm":    "0 1px 4px rgba(0,0,0,0.4)",
      },

      borderColor: {
        DEFAULT: "rgba(255,255,255,0.08)",
        soft:    "rgba(255,255,255,0.04)",
        red:     "rgba(255,45,45,0.3)",
        lime:    "rgba(200,255,0,0.25)",
        violet:  "rgba(168,85,247,0.25)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      spacing: {
        "18":  "4.5rem",
        "22":  "5.5rem",
        "88":  "22rem",
        "112": "28rem",
        "128": "32rem",
      },

      transitionTimingFunction: {
        "out-expo":    "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-soft": "cubic-bezier(0.45, 0, 0.55, 1)",
        "spring":      "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};