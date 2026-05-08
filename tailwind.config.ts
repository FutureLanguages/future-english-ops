import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "16px",
        md: "24px",
        lg: "32px",
      },
      screens: {
        wide: "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", '"Tajawal"', '"Noto Sans Arabic"', "sans-serif"],
        body: ["var(--font-body)", '"Tajawal"', '"Noto Sans Arabic"', "sans-serif"],
        heading: ["var(--font-heading)", '"Tajawal"', '"Noto Sans Arabic"', "sans-serif"],
      },
      fontSize: {
        h1: "var(--text-h1)",
        h2: "var(--text-h2)",
        h3: "var(--text-h3)",
        body: "var(--text-body)",
        helper: "var(--text-helper)",
        caption: "var(--text-caption)",
        "meta-desktop": "var(--text-meta-desktop)",
        "meta-mobile": "var(--text-meta-mobile)",
      },
      colors: {
        brand: withOpacity("--color-primary-500-rgb"),
        sky: withOpacity("--color-secondary-500-rgb"),
        sand: withOpacity("--color-bg-app-rgb"),
        ink: withOpacity("--color-text-primary-rgb"),
        pine: withOpacity("--color-success-700-rgb"),
        clay: withOpacity("--color-primary-200-rgb"),
        mist: withOpacity("--color-success-100-rgb"),
        primary: {
          200: withOpacity("--color-primary-200-rgb"),
          500: withOpacity("--color-primary-500-rgb"),
          600: withOpacity("--color-primary-600-rgb"),
        },
        secondary: {
          100: withOpacity("--color-secondary-100-rgb"),
          500: withOpacity("--color-secondary-500-rgb"),
          600: withOpacity("--color-secondary-600-rgb"),
        },
        success: {
          100: withOpacity("--color-success-100-rgb"),
          700: withOpacity("--color-success-700-rgb"),
        },
        warning: {
          100: withOpacity("--color-warning-100-rgb"),
          500: withOpacity("--color-warning-500-rgb"),
        },
        error: {
          100: withOpacity("--color-error-100-rgb"),
          600: withOpacity("--color-error-600-rgb"),
        },
        info: {
          100: withOpacity("--color-info-100-rgb"),
          500: withOpacity("--color-info-500-rgb"),
        },
        bg: {
          app: withOpacity("--color-bg-app-rgb"),
          surface: withOpacity("--color-bg-surface-rgb"),
          "surface-alt": withOpacity("--color-bg-surface-alt-rgb"),
          overlay: "var(--color-bg-overlay)",
          "backdrop-blur": "var(--color-bg-backdrop-blur)",
        },
        text: {
          primary: withOpacity("--color-text-primary-rgb"),
          secondary: withOpacity("--color-text-secondary-rgb"),
          muted: withOpacity("--color-text-muted-rgb"),
          "on-primary": withOpacity("--color-text-on-primary-rgb"),
        },
        border: {
          subtle: withOpacity("--color-border-subtle-rgb"),
          strong: withOpacity("--color-border-strong-rgb"),
          focus: withOpacity("--color-border-focus-rgb"),
        },
      },
      boxShadow: {
        soft: "0 18px 48px rgba(17, 33, 45, 0.08)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        sticky: "var(--shadow-sticky)",
        drawer: "var(--shadow-drawer)",
        modal: "var(--shadow-modal)",
      },
      borderRadius: {
        panel: "1.5rem",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        badge: "var(--radius-badge)",
        chip: "var(--radius-chip)",
        drawer: "var(--radius-drawer)",
        modal: "var(--radius-modal)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      borderWidth: {
        DEFAULT: "var(--border-default)",
        strong: "var(--border-strong)",
        focus: "var(--border-focus)",
      },
      zIndex: {
        base: "var(--z-base)",
        card: "var(--z-card)",
        sticky: "var(--z-sticky)",
        dropdown: "var(--z-dropdown)",
        overlay: "var(--z-overlay)",
        drawer: "var(--z-drawer)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        "header-desktop": "var(--header-height-desktop)",
        "header-mobile": "var(--header-height-mobile)",
      },
      transitionDuration: {
        DEFAULT: "var(--transition-duration-default)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--transition-ease-default)",
      },
      screens: {
        mobile: "375px",
        tablet: "768px",
        desktop: "1024px",
        wide: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
