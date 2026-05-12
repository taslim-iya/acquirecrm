import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Inter"',
          '"Helvetica Neue"',
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          '"SF Mono"',
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      // Apple's type ramp leans tighter and uses negative tracking on larger sizes.
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5',  letterSpacing: '0.005em' }],
        'sm':   ['0.8125rem',{ lineHeight: '1.5',  letterSpacing: '0em' }],
        'base': ['0.9375rem',{ lineHeight: '1.55', letterSpacing: '-0.011em' }],
        'lg':   ['1.0625rem',{ lineHeight: '1.5',  letterSpacing: '-0.014em' }],
        'xl':   ['1.1875rem',{ lineHeight: '1.45', letterSpacing: '-0.017em' }],
        '2xl':  ['1.4375rem',{ lineHeight: '1.35', letterSpacing: '-0.02em'  }],
        '3xl':  ['1.75rem',  { lineHeight: '1.3',  letterSpacing: '-0.024em' }],
        '4xl':  ['2.125rem', { lineHeight: '1.2',  letterSpacing: '-0.028em' }],
        '5xl':  ['2.75rem',  { lineHeight: '1.1',  letterSpacing: '-0.032em' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        stage: {
          cold: "hsl(var(--stage-cold))",
          warm: "hsl(var(--stage-warm))",
          hot: "hsl(var(--stage-hot))",
          success: "hsl(var(--stage-success))",
          passed: "hsl(var(--stage-passed))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        "shimmer": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        "accordion-up":   "accordion-up 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-subtle":   "pulse-subtle 2s ease-in-out infinite",
        "shimmer":        "shimmer 2s infinite",
      },
      boxShadow: {
        'xs':         '0 1px 1px rgba(0, 0, 0, 0.04)',
        'card':       '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'glow':       '0 0 0 4px hsl(211 100% 50% / 0.12)',
        'glow-lg':    '0 0 0 6px hsl(211 100% 50% / 0.18)',
        'apple-sm':   '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03)',
        'apple-md':   '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-lg':   '0 12px 32px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'apple-xl':   '0 24px 56px rgba(0, 0, 0, 0.14), 0 4px 8px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        'apple':   'cubic-bezier(0.22, 1, 0.36, 1)',
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
