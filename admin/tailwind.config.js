/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mia-orange': '#FF8A00',
        'mia-pink':   '#FF2EC9',
        'mia-purple': '#7B2CFF',
        'mia-blue':   '#00D1FF',
        'mia-black':  '#0A0A0F',
        'mia-dark':   '#13131A',
        'mia-card':   '#1A1A24',
        'mia-border': 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow':   'glow-pulse 2s ease-in-out infinite',
        'spin-glow':    'rotate-glow 3s linear infinite',
        'float':        'float 3s ease-in-out infinite',
        'slide-up':     'slide-up 0.3s ease-out',
        'fade-in':      'fade-in 0.2s ease-out',
        'breathe':      'breathe 4s ease-in-out infinite',
        shimmer:        'shimmer 1.5s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%':      { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        'rotate-glow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.04)', opacity: '0.85' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
