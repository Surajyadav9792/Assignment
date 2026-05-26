/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--ff-bg)',
        elev: 'var(--ff-bg-elev)',
        elev2: 'var(--ff-bg-elev-2)',
        border: 'var(--ff-border)',
        text: 'var(--ff-text)',
        muted: 'var(--ff-text-muted)',
        subtle: 'var(--ff-text-subtle)',
        accent: 'var(--ff-accent)',
        'accent-hover': 'var(--ff-accent-hover)',
        'accent-soft': 'var(--ff-accent-soft)',
        success: 'var(--ff-success)',
        warn: 'var(--ff-warn)',
        danger: 'var(--ff-danger)',
        info: 'var(--ff-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '14px',
        md: '15px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '10px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.4)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.35)',
        elev: '0 8px 28px rgba(0,0,0,0.5)',
      },
      letterSpacing: {
        tightish: '-0.01em',
      },
    },
  },
  plugins: [],
};
