/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
      },
    },
  },
  plugins: [],
}