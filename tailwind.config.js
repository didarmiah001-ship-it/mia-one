/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './admin/index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './admin/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand / always-constant
        mia: {
          orange: '#FF8A00',
          pink:   '#FF2EC9',
          purple: '#7B2CFF',
          blue:   '#00D1FF',
          black:  '#0A0A0F',
          navy:   '#0D1117',
          card:   '#141820',
          surface:'#1A1F2E',
        },
        // Flat aliases for admin panel
        'mia-orange':  '#FF8A00',
        'mia-pink':    '#FF2EC9',
        'mia-purple':  '#7B2CFF',
        'mia-blue':    '#00D1FF',
        'mia-black':   '#0A0A0F',
        'mia-dark':    '#13131A',
        'mia-card':    '#1A1A24',
        // Theme-aware tokens backed by CSS variables
        'theme-bg':      'var(--bg-base)',
        'theme-card':    'var(--bg-card)',
        'theme-surface': 'var(--bg-surface)',
        'theme-text':    'var(--text-primary)',
        'theme-muted':   'var(--text-muted)',
        'theme-border':  'var(--border-normal)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      scale: {
        '115': '1.15',
      },
      animation: {
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'rotate-glow':   'rotate-glow 2.5s linear infinite',
        'float':         'float 3s ease-in-out infinite',
        'slide-up':      'slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in':       'fade-in 0.4s ease-out',
        'breathe':       'breathe 2.5s ease-in-out infinite',
        'shimmer':       'shimmer-move 2s infinite',
      },
      keyframes: {
        'glow-pulse':  { '0%, 100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        'rotate-glow': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'float':       { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'slide-up':    { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'fade-in':     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'breathe':     { '0%, 100%': { transform: 'scale(1)', opacity: '0.8' }, '50%': { transform: 'scale(1.05)', opacity: '1' } },
        'shimmer-move':{ '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};
