/* eslint-disable */
const { nextui } = require('@nextui-org/react')
const { dirname } = require('path')
const { join } = require('path')

const nextuipath = dirname(require.resolve('@nextui-org/theme'))

/** @type {import('@nextui-org/react').NextUIPluginConfig } */
const nextuiconfig = {
  layout: {
    radius: {
      small: '0.124rem',
      medium: '0.25rem',
      large: '0.5rem'
    }
  }
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ...
    './src/app/src/**/*.{js,ts,jsx,tsx}',
    `${nextuipath}/**/*.{js,ts,jsx,tsx}`
  ],
  theme: {
    extend: {}
  },
  darkMode: 'class',
  plugins: [nextui(nextuiconfig)]
}
