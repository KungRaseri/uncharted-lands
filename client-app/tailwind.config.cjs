const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio")
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Aboreto', 'cursive', ...defaultTheme.fontFamily.sans],
      },
    },
  },
}
