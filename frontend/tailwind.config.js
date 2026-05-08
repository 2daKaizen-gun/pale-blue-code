/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg:       'var(--color-cosmos-bg)',
          surface:  'var(--color-cosmos-surface)',
          elevated: 'var(--color-cosmos-elevated)',
          text:     'var(--color-cosmos-text)',
          muted:    'var(--color-cosmos-muted)',
          subtle:   'var(--color-cosmos-subtle)',
          star:     'var(--color-cosmos-star)',
          nebula:   'var(--color-cosmos-nebula)',
          aurora:   'var(--color-cosmos-aurora)',
          solar:    'var(--color-cosmos-solar)',
          border:   'var(--color-cosmos-border)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
}
