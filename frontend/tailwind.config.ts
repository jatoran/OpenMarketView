import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background-hex)',
        foreground: 'var(--foreground-hex)',
        card: 'var(--card-hex)',
        'card-foreground': 'var(--card-foreground-hex)',
        primary: 'var(--primary-hex)',
        'primary-foreground': 'var(--primary-foreground-hex)',
        secondary: 'var(--secondary-hex)',
        'secondary-foreground': 'var(--secondary-foreground-hex)',
        muted: 'var(--muted-hex)',
        'muted-foreground': 'var(--muted-foreground-hex)',
        accent: 'var(--accent-hex)',
        'accent-foreground': 'var(--accent-foreground-hex)',
        border: 'var(--border-hex)',
        'detailed-card-foreground': 'var(--detailed-card-foreground-hex)',
        popover: 'var(--popover-hex)',
        'popover-foreground': 'var(--popover-foreground-hex)',
        'chart-line': 'var(--chart-line-hex)',
        'chart-text': 'var(--chart-text-hex)',
        
        'chart-time-selector': 'var(--chart-time-selector-hex)',
      },
      textColor: {
        DEFAULT: 'var(--foreground-hex)',
      },
      backgroundColor: {
        DEFAULT: 'var(--background-hex)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config