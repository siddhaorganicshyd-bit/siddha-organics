/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        'cream-dark': '#EDE5D0',
        green: {
          DEFAULT: '#2D5016',
          light: '#4A7C2F',
          dark: '#1A3009',
        },
        brown: {
          DEFAULT: '#8B4513',
          light: '#A0522D',
          dark: '#6B3410',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
