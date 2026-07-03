/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070c',
          900: '#0b0b12',
          800: '#12121c',
          700: '#1a1a28',
          600: '#242437',
          500: '#33334d',
        },
        gold: { DEFAULT: '#e7b53c', soft: '#f4d58a', deep: '#b8892a' },
        neon: { DEFAULT: '#8b5cf6', soft: '#a78bfa', cyan: '#22d3ee' },
        seat: {
          available: '#2a2a3d',
          held: '#f59e0b',
          booked: '#3f3f52',
          selected: '#8b5cf6',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(139, 92, 246, 0.55)',
        'glow-gold': '0 0 24px -4px rgba(231, 181, 60, 0.5)',
        card: '0 18px 50px -12px rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(135deg, #f4d58a 0%, #e7b53c 45%, #b8892a 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0.5)' },
          '50%': { boxShadow: '0 0 22px 4px rgba(139,92,246,0.35)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
