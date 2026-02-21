import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Couleurs du site (dynamiques depuis l'API – client, admin, employé)
        site: {
          primary: "var(--site-primary-hex, #DC2626)",
          secondary: "var(--site-secondary-hex, #B91C1C)",
          tertiary: "var(--site-tertiary-hex, #991B1B)",
          "button-primary": "var(--site-button-primary-hex, var(--site-primary-hex, #DC2626))",
          "button-primary-hover": "var(--site-button-primary-hover-hex, var(--site-secondary-hex, #B91C1C))",
          "button-text": "var(--site-button-text-hex, #FFFFFF)",
          "text-primary": "var(--site-text-primary-hex, var(--site-primary-hex, #DC2626))",
          "text-link": "var(--site-text-link-hex, var(--site-primary-hex, #DC2626))",
          "text-link-hover": "var(--site-text-link-hover-hex, var(--site-secondary-hex, #B91C1C))",
          "banner-bg": "var(--site-banner-bg-hex, var(--site-primary-hex, #DC2626))",
          "banner-text": "var(--site-banner-text-hex, #FFFFFF)",
          "footer-bg": "var(--site-footer-bg-hex, #FEF2F2)",
          "footer-text": "var(--site-footer-text-hex, #374151)",
          "footer-link": "var(--site-footer-link-hex, var(--site-primary-hex, #DC2626))",
          "footer-link-hover": "var(--site-footer-link-hover-hex, var(--site-secondary-hex, #B91C1C))",
          "footer-border": "var(--site-footer-border-hex, #FECACA)",
          "button-border": "var(--site-button-border-hex, transparent)",
          "button-outline-border": "var(--site-button-outline-border-hex, var(--site-primary-hex, #DC2626))",
          "button-outline-text": "var(--site-button-outline-text-hex, var(--site-primary-hex, #DC2626))",
          "button-outline-hover-bg": "var(--site-button-outline-hover-bg-hex, var(--site-primary-hex, #DC2626))",
          "name-part1": "var(--site-name-part1-hex, #111827)",
          "name-part2": "var(--site-name-part2-hex, var(--site-primary-hex, #DC2626))",
          "tagline": "var(--site-tagline-hex, #6B7280)",
          "banner-button": "var(--site-banner-button-hex, var(--site-primary-hex, #DC2626))",
          "banner-button-border": "var(--site-banner-button-border-hex, transparent)",
          "section-services-bg": "var(--site-section-services-bg-hex, var(--site-primary-hex, #DC2626))",
          "section-services-text": "var(--site-section-services-text-hex, #FFFFFF)",
          "section-services-button": "var(--site-section-services-button-hex, var(--site-primary-hex, #DC2626))",
          "section-services-button-border": "var(--site-section-services-button-border-hex, transparent)",
          "section-agencies-bg": "var(--site-section-agencies-bg-hex, var(--site-primary-hex, #DC2626))",
          "section-agencies-text": "var(--site-section-agencies-text-hex, #FFFFFF)",
          "section-agencies-button": "var(--site-section-agencies-button-hex, var(--site-primary-hex, #DC2626))",
          "section-agencies-button-border": "var(--site-section-agencies-button-border-hex, transparent)",
          "section-employe-bg": "var(--site-section-employe-bg-hex, var(--site-primary-hex, #DC2626))",
          "section-employe-text": "var(--site-section-employe-text-hex, #FFFFFF)",
          "section-employe-button": "var(--site-section-employe-button-hex, var(--site-primary-hex, #DC2626))",
          "section-employe-button-border": "var(--site-section-employe-button-border-hex, transparent)",
          "section-admin-login-bg": "var(--site-section-admin-login-bg-hex, var(--site-primary-hex, #DC2626))",
          "section-admin-login-text": "var(--site-section-admin-login-text-hex, #FFFFFF)",
          "section-admin-login-button": "var(--site-section-admin-login-button-hex, var(--site-primary-hex, #DC2626))",
          "section-admin-login-button-border": "var(--site-section-admin-login-button-border-hex, transparent)",
          "section-employe-login-bg": "var(--site-section-employe-login-bg-hex, var(--site-primary-hex, #DC2626))",
          "section-employe-login-text": "var(--site-section-employe-login-text-hex, #FFFFFF)",
          "section-employe-login-button": "var(--site-section-employe-login-button-hex, var(--site-primary-hex, #DC2626))",
          "section-employe-login-button-border": "var(--site-section-employe-login-button-border-hex, transparent)",
        },
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
