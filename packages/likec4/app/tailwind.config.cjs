const { radixThemePreset } = require('radix-themes-tw');
const { resolve } = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [radixThemePreset],
  darkMode: ['class', '[data-mode="dark"]'],
  content: [
    resolve(__dirname, './src') + '/**/*.{js,jsx,ts,tsx,md,mdx}',
    resolve(__dirname, './index.html'),
  ],
  corePlugins: {
    // ...
    // Preflight is enabled by default, we disable it here
    preflight: false
  }
};
