import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        hand: ["Caveat", "cursive"],
      },
      colors: {
        paper: "#FFFBF2",
        line: "#E9DFC9",
        ink: "#2B2A33",
        muted: "#7A7585",
        brand: { DEFAULT: "#2F9E77", dark: "#237A5C", soft: "#DDF3EA" },
        sun: { DEFAULT: "#F6B93B", soft: "#FDF0D2" },
        coral: { DEFAULT: "#E8684A", soft: "#FBE3DC" },
        sky: { DEFAULT: "#4A90D9", soft: "#E0EDFA" },
        plum: { DEFAULT: "#9B6BD3", soft: "#EFE5FA" },
      },
      boxShadow: { card: "0 1px 2px rgba(43,42,51,.06), 0 4px 16px rgba(43,42,51,.06)" },
    },
  },
  plugins: [],
} satisfies Config;
