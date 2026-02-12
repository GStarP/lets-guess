/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(79, 70, 229, 0.15)',
      },
    },
  },
  plugins: [],
}
