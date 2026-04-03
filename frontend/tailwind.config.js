/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Orbitron'", "monospace"],
        mono:    ["'Share Tech Mono'", "monospace"],
        body:    ["'Exo 2'", "sans-serif"],
      },
      colors: {
        void:  "#030308",
        grid:  "#0d0d1a",
        panel: "#0f0f1f",
        neon: {
          cyan:   "#00f5ff",
          pink:   "#ff0080",
          green:  "#00ff88",
          yellow: "#ffdd00",
          purple: "#9b5de5",
        },
        dim: {
          cyan:   "#00c4cc",
          pink:   "#cc0066",
          border: "#1a1a2e",
        },
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "flicker":    "flicker 3s linear infinite",
        "scan":       "scan 4s linear infinite",
        "win-glow":   "win-glow 0.6s ease-out forwards",
        "cell-pop":   "cell-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "countdown":  "countdown linear forwards",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%":      { opacity: "0.85", filter: "brightness(1.3)" },
        },
        "flicker": {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%":            { opacity: "0.4" },
        },
        "scan": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "win-glow": {
          "0%":   { filter: "brightness(1)" },
          "50%":  { filter: "brightness(2) saturate(2)" },
          "100%": { filter: "brightness(1.5) saturate(1.5)" },
        },
        "cell-pop": {
          "0%":   { transform: "scale(0) rotate(-10deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotate(0deg)",  opacity: "1" },
        },
        "countdown": {
          "0%":   { "stroke-dashoffset": "0" },
          "100%": { "stroke-dashoffset": "283" },
        },
      },
      boxShadow: {
        "neon-cyan":   "0 0 10px #00f5ff, 0 0 30px #00f5ff40",
        "neon-pink":   "0 0 10px #ff0080, 0 0 30px #ff008040",
        "neon-green":  "0 0 10px #00ff88, 0 0 30px #00ff8840",
        "neon-border": "inset 0 0 20px #00f5ff10, 0 0 20px #00f5ff10",
      },
    },
  },
  plugins: [],
};
