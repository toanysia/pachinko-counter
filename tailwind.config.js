/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          200: '#c7c7ff',
          300: '#a5a5fc',
          400: '#8880f8',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
        },
        surface: {
          900: '#0a0a1a',
          800: '#12122a',
          700: '#1a1a3e',
          600: '#22224e',
          500: '#2e2e66',
        },
      },
      animation: {
        'bounce-once': 'bounce 0.4s ease-in-out 1',
        'pulse-fast': 'pulse 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
