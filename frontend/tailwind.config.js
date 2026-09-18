/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        monad: {
          purple: "#7A3FEF",
          dark: "#0F0B1E",
          card: "#16122C",
          border: "#2A244D",
          accent: "#A78BFA",
          cyan: "#00F2FE",
          up: "#00E676",
          down: "#FF1744",
        }
      }
    },
  },
  plugins: [],
}
