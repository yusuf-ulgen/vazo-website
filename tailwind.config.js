/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--color-canvas-default)',
          subtle: 'var(--color-canvas-subtle)',
          muted: 'var(--color-canvas-muted)',
          warm: 'var(--color-canvas-warm)',
        },
        surface: {
          DEFAULT: 'var(--color-surface-primary)',
          primary: 'var(--color-surface-primary)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          muted: 'var(--color-surface-muted)',
          accent: 'var(--color-surface-accent)',
          inverse: 'var(--color-surface-inverse)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          accent: 'var(--color-text-accent)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
          inverse: 'var(--color-border-inverse)',
          focus: 'var(--color-border-focus)',
        },
        action: {
          primary: {
            DEFAULT: 'var(--color-action-primary-bg)',
            hover: 'var(--color-action-primary-hover)',
            text: 'var(--color-action-primary-text)',
          },
          secondary: {
            DEFAULT: 'var(--color-action-secondary-bg)',
            hover: 'var(--color-action-secondary-hover)',
            text: 'var(--color-action-secondary-text)',
          },
        },
        feedback: {
          success: 'var(--color-feedback-success)',
          'success-surface': 'var(--color-feedback-success-surface)',
          warning: 'var(--color-feedback-warning)',
          'warning-surface': 'var(--color-feedback-warning-surface)',
          danger: 'var(--color-feedback-danger)',
          'danger-surface': 'var(--color-feedback-danger-surface)',
          info: 'var(--color-feedback-info)',
          'info-surface': 'var(--color-feedback-info-surface)',
        },
        brand: {
          stone: 'var(--color-brand-stone)',
          sand: 'var(--color-brand-sand)',
          taupe: 'var(--color-brand-taupe)',
          terracotta: 'var(--color-brand-terracotta)',
          olive: 'var(--color-brand-olive)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        dropdown: 'var(--shadow-dropdown)',
      },
      letterSpacing: {
        editorial: '0.15em',
        wide: '0.08em',
      },
    },
  },
  plugins: [],
};
