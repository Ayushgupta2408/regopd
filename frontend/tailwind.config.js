/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0E14",
          900: "#11151D",
          800: "#171C27",
          700: "#212836",
        },
        vellum: "#F2EEE4",
        signal: {
          DEFAULT: "#3AA7A0", // teal-cyan "annotation" accent
          soft: "#2C8B85",
        },
        marker: "#E8A33D", // warm highlighter accent, used sparingly
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
