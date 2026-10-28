import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: 'var(--color-sand)',
          50: '#FDFBF7',
          100: '#FBF7F0',
          200: '#F4ECE0',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          elevated: 'var(--color-card-elevated)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-muted)',
        },
        lagoon: {
          DEFAULT: 'var(--color-lagoon)',
          hover: 'var(--color-lagoon-hover)',
          active: 'var(--color-lagoon-active)',
          light: '#E6F6F6',
        },
        'deep-sea': {
          DEFAULT: 'var(--color-deep-sea)',
        },
        coral: {
          DEFAULT: 'var(--color-coral)',
          light: '#FFF0EC',
          dark: '#E05E3F',
        },
        sunshine: {
          DEFAULT: 'var(--color-sunshine)',
          light: '#FFF8E7',
        },
        seafoam: {
          DEFAULT: 'var(--color-seafoam)',
          light: '#EDFAF5',
          dark: '#14755F',
        },
        sky: {
          DEFAULT: 'var(--color-sky)',
          light: '#F2F8FC',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'sheet': '24px',
        'chip': '9999px',
        'btn': '14px',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'float': 'var(--shadow-float)',
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
} satisfies Config;
