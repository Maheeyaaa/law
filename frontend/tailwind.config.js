/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        bebas:    ['"Bebas Neue"', 'cursive'],
        dm:       ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}