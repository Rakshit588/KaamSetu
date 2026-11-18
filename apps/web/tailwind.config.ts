import type { Config } from 'tailwindcss';

// Every colour is a CSS variable (see app/globals.css) so light and dark mode share one set of classes.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        brand: token('brand'),
        saffron: token('saffron'),
        flame: token('flame'),
        mint: token('mint'),
        coral: token('coral'),
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'var(--font-deva)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-deva)', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.06), 0 10px 28px -10px rgb(var(--shadow) / 0.14)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.08), 0 28px 56px -18px rgb(var(--shadow) / 0.3)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.9s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
