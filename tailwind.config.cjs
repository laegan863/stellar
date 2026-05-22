const daisyui = require("daisyui");
const typography = require("@tailwindcss/typography");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
  ],
  plugins: [typography, daisyui],
};
