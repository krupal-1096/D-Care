/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"Space Grotesk"', "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f1fcf4",
          100: "#def7e4",
          200: "#b8ecc6",
          300: "#8ddfa5",
          400: "#5ed483",
          500: "#35c96b",
          600: "#28a555",
          700: "#1f8244",
          800: "#1a6637",
          900: "#144d2b"
        },
        ink: "#0d1b2a",
        stone: "#556572"
      },
      boxShadow: {
        card: "0 10px 40px rgba(0, 0, 0, 0.08)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: []
};
