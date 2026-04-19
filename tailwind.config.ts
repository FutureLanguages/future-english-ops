import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-tajawal)', '"Tajawal"', '"Noto Sans Arabic"', "sans-serif"],
      },
      colors: {
        sand: "#f7f3ea",
        ink: "#11212d",
        pine: "#21443c",
        clay: "#d6c2a8",
        mist: "#eef3f1",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(17, 33, 45, 0.08)",
      },
      borderRadius: {
        panel: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
