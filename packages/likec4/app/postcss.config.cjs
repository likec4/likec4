const autoprefixer = require('autoprefixer');
const nesting = require('tailwindcss/nesting/index.js');
const tailwindcss = require('tailwindcss');
const { resolve } = require('path');

const tailwindCfg = resolve(__dirname, './tailwind.config.cjs');

/* @type {import('postcss').Postcss} */
module.exports = {
  plugins: [nesting, tailwindcss(tailwindCfg), autoprefixer],
};
