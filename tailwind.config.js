/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#0D1117",
        "surface-card": "#121820",
        "surface-highlight": "#1A2230",
        "electric-blue": "#00C8FF",
        "electric-blue-hover": "#00E0FF",
        "electric-blue-muted": "rgba(0, 200, 255, 0.15)",
        "premium-gold": "#F4B400",
        "premium-gold-bright": "#FFC820",
        "premium-gold-muted": "rgba(244, 180, 0, 0.15)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#AEB6C2",
        "text-muted": "#6E7681",
        "border-subtle": "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(0, 200, 255, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-blue": "0 0 25px -5px rgba(0, 200, 255, 0.4)",
        "glow-blue-lg": "0 0 50px -10px rgba(0, 200, 255, 0.5)",
        "glow-gold": "0 0 25px -5px rgba(244, 180, 0, 0.4)",
        "glow-gold-lg": "0 0 50px -10px rgba(244, 180, 0, 0.5)",
        "card-cyber": "0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "trace-flow": "traceFlow 3s ease-in-out infinite",
      },
      keyframes: {
        traceFlow: {
          "0%, 100%": { opacity: 0.2, strokeDashoffset: "100" },
          "50%": { opacity: 0.8, strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};
