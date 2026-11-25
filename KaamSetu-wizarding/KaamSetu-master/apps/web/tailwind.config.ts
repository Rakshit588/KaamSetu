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
        serif: ['var(--font-serif)', 'var(--font-deva)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl2: '0.9rem',
        xl3: '1.1rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.25), 0 12px 30px -12px rgb(var(--shadow) / 0.45)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.3), 0 28px 56px -18px rgb(var(--shadow) / 0.6), 0 0 0 1px rgb(var(--gold) / 0.25)',
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
