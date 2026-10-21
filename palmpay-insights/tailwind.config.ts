import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        pp: { DEFAULT: "#6C2BD9", dark: "#4B1A9E", soft: "#F1EAFD", ink: "#1E1530" },
        ok: { DEFAULT: "#16A34A", soft: "#DCFCE7" },
        warn: { DEFAULT: "#D97706", soft: "#FEF3C7" },
        bad: { DEFAULT: "#DC2626", soft: "#FEE2E2" },
        tip: { DEFAULT: "#2563EB", soft: "#DBEAFE" },
        muted: "#6B6478",
      },
      boxShadow: { card: "0 1px 2px rgba(30,21,48,.06), 0 6px 20px rgba(30,21,48,.07)" },
    },
  },
  plugins: [],
} satisfies Config;
