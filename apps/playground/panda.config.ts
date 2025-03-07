import { themeToVars } from '@mantine/vanilla-extract'
import { defineConfig } from '@pandacss/dev'
import { concat, entries, fromEntries, map, mapValues, pipe } from 'remeda'
import { theme } from './src/mantine'

const mantine = themeToVars(theme)
// entries(mantine.colors.main).forEach(([key, value]) => {

type MantineColors = typeof mantine.colors

const mapcolor = (color: keyof MantineColors) => ({
  [color]: {
    value: mantine.colors[color] as string,
  },
})

const mapcolors = (color: keyof MantineColors, prefix = color) =>
  pipe(
    mantine.colors[color] as typeof mantine.colors.main,
    entries(),
    map(([key, value]) => [`${prefix}.${key}`, { value }] as [string, { value: string }]),
    concat([[prefix, { value: mantine.colors[color]![5] }]] as [[string, { value: string }]]),
    fromEntries(),
  )

export default defineConfig({
  jsxFramework: 'react',
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  conditions: {
    extend: {
      light: ':where([data-mantine-color-scheme="light"]) &',
      dark: ':where([data-mantine-color-scheme="dark"]) &',
      // _likec4NodeHovered: '#like4-root &',
    },
  },

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        spacing: {
          ...mapValues(mantine.spacing, (value) => ({ value })),
        },
        colors: {
          text: {
            value: mantine.colors.text,
          },
          ...mapcolor('defaultBorder'),
          ...mapcolor('defaultColor'),
          ...mapcolor('defaultHover'),
          ...mapcolor('default'),
          ...mapcolor('dimmed'),
          ...mapcolors('primaryColors', 'primary'),
          ...mapcolors('main'),
          ...mapcolors('gray'),
          ...mapcolors('green'),
          ...mapcolors('red'),
          ...mapcolors('teal'),
          ...mapcolors('pink'),
          ...mapcolors('yellow'),
        },
        fonts: {
          body: {
            value: 'var(--likec4-app-font)',
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',
})
