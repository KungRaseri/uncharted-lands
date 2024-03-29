const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    require('path').join(require.resolve('@skeletonlabs/skeleton')),
    './src/**/*.{html,js,svelte,ts}'
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    ...require('@skeletonlabs/skeleton/tailwind/skeleton.cjs')()
  ],
  important: true
}
