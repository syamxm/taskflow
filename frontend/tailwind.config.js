/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Lavender / Purple Breeze surfaces
        gray: {
          50: '#f3efff',
          100: '#f3efff',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a99ac4',
          500: '#7d6f9a',
          600: '#3a2d4f',
          700: '#2b203a',
          800: '#241836',
          900: '#171022',
          950: '#0f0c18',
        },
        // Violet accent
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
};
