import { type Preset, definePreset } from '@pandacss/dev'
import radixColorsPreset from 'pandacss-preset-radix-colors'
import { conditions } from './conditions'
import { nodeOrEdge, radixColors, root, rootNotReduced } from './const'
import { compoundColors, globalCss, themeColors } from './generated'
import { patterns } from './patterns'
import { theme } from './theme'
import { utilities } from './utilities'

export default definePreset({
  name: 'likec4',
  // Whether to use css reset
  // presets: [
  //   PandaPreset as any,
  // ],
  presets: [
    radixColorsPreset({
      autoP3: false,
      darkMode: {
        condition: '[data-mantine-color-scheme="dark"] &',
      },
      colorScales: radixColors,
    }) as unknown as Preset,
  ],
  globalVars: {
    extend: {
      '--likec4-palette': {
        syntax: '*',
        inherits: false,
        // initialValue: `'likec4.primary'`,
      },
      '--likec4-text-size': {
        syntax: '<length-percentage>',
        inherits: false,
        // initialValue: '1rem',
      },
      '--likec4-spacing': {
        syntax: '<length-percentage>',
        inherits: false,
        // initialValue: '1rem',
      },
    },
  },
  globalCss: {
    extend: {
      // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
      //   // TODO: this workaround disables animations in Safari (to improve performance)
      //   ['--likec4-safari-animation-hook']: ' ',
      // },
      ':where(:host, :root)': {
        ['--likec4-app-font-default']:
          `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
      },
      '.likec4-shadow-root': {
        display: 'contents',
        '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
        '--mantine-font-family-headings': 'var(--likec4-app-font, var(--likec4-app-font-default))',
      },
      [`${root}`]: {
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '0px',
        margin: '0px',
        border: '0px solid transparent',
        containerName: 'likec4-root',
        containerType: 'size',
      },
      [`${root} .react-flow:is(.not-initialized)`]: {
        opacity: 0,
      },
      [`:where(${root} .mantine-ActionIcon-icon) .tabler-icon`]: {
        width: '75%',
        height: '75%',
      },
      [`${root} ${nodeOrEdge}:has([data-likec4-dimmed])`]: {
        opacity: 0.25,
      },
      [`${rootNotReduced} ${nodeOrEdge}:has([data-likec4-dimmed])`]: {
        filter: 'auto',
        grayscale: 0.85,
        blur: '3px',
      },
      [`${rootNotReduced} ${nodeOrEdge}:has([data-likec4-dimmed="true"])`]: {
        transitionProperty: 'opacity, filter',
        transitionTimingFunction: '{easings.inOut}',
        transitionDuration: '600ms',
        // transitionDelay: '100ms',
      },
      [`[data-mantine-color-scheme="dark"] ${rootNotReduced} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`]:
        {
          mixBlendMode: 'plus-lighter',
        },
      [`[data-mantine-color-scheme="light"] ${rootNotReduced} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`]:
        {
          mixBlendMode: 'screen',
        },
      ...globalCss,
    },
  },
  staticCss: {
    extend: {
      themes: ['light', 'dark'],
      css: [{
        properties: {
          color: [
            'likec4.palette.hiContrast',
            'likec4.palette.loContrast',
          ],
          likec4Palette: [...themeColors, ...compoundColors],
          likec4RelationPalette: themeColors,
        },
      }],
    },
  },
  conditions,
  patterns,
  utilities,
  theme,
})

export { theme }
