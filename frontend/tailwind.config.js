/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Ethereal Glass — near-black neutrals with a faint violet undertone
        gray: {
          50: '#f6f5fa',
          100: '#ebeaf2',
          200: '#d8d6e3',
          300: '#b6b3c6',
          400: '#8f8ba3',
          500: '#6c687f',
          600: '#4c485e',
          700: '#312e40',
          800: '#201d2c',
          900: '#12101b',
          950: '#050505',
        },
        // Violet accent
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      borderRadius: {
        card: '2rem',
        'card-inner': 'calc(2rem - 0.375rem)',
      },
      boxShadow: {
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        lift: '0 24px 48px -16px rgba(0, 0, 0, 0.6)',
        glow: '0 0 32px -8px rgba(139, 92, 246, 0.35)',
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(1.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(1rem) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        reveal: 'reveal 0.8s cubic-bezier(0.32, 0.72, 0, 1) both',
        'modal-in': 'modal-in 0.5s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
};
