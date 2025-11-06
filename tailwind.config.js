/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js", "./docs/**/*.md"],
  theme: {
    extend: {
      colors: {
        coffee: "#6f4e37",
      },
    },
  },
  plugins: [],
};
