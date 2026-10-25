export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { paper: "#F6F1E7", panel: "#FFFDF8", rule: "#D9D2C0", ink: "#14213D", muted: "#4F5A70", stamp: "#B3261E", tint: "#ECE4D2" },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
