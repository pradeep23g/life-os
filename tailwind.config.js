/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        background: 'oklch(var(--bg-base) / <alpha-value>)',
        surface: 'oklch(var(--bg-surface) / <alpha-value>)',
        elevated: 'oklch(var(--bg-elevated) / <alpha-value>)',
        border: {
          DEFAULT: 'oklch(var(--border-base) / <alpha-value>)',
          subtle: 'oklch(var(--border-subtle) / <alpha-value>)',
        },
        text: {
          primary: 'oklch(var(--text-primary) / <alpha-value>)',
          secondary: 'oklch(var(--text-secondary) / <alpha-value>)',
          tertiary: 'oklch(var(--text-tertiary) / <alpha-value>)',
        },
        accent: {
          primary: 'oklch(var(--accent-primary) / <alpha-value>)',
          secondary: 'oklch(var(--accent-secondary) / <alpha-value>)',
        },
        threat: {
          critical: 'oklch(var(--threat-critical) / <alpha-value>)',
          warning: 'oklch(var(--threat-warning) / <alpha-value>)',
          healthy: 'oklch(var(--threat-healthy) / <alpha-value>)',
        }
      },
    },
  },
  plugins: [],
}
