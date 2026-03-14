/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fafafa',
          100: '#f1f5f9',
          200: '#e4e4e7',
          300: '#a1a1aa',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#3f3f46',
          700: '#222222',
          800: '#111111',
          900: '#0a0a0a',
          950: '#000000',
        },
        surface: '#0a0a0a',
        border: '#222222',
      },
    },
  },
  plugins: [],
}
