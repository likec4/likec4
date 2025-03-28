import { definePreset } from '@pandacss/dev'
import { conditions } from './conditions'
import { compoundColors, globalCss, themeColors } from './generated'
import { theme } from './theme'
import { likec4Palette, likec4RelationPalette } from './utilities'

const root = '.likec4-root'
const rootNotReduced = `${root}:not([data-likec4-reduced-graphics])`

const nodeOrEdge = `:where(.react-flow__node, .react-flow__edge, .likec4-edge-label-container)`

export default definePreset({
  name: 'likec4',
  // Whether to use css reset
  // presets: [
  //   PandaPreset as any,
  // ],
  globalVars: {
    '--likec4-palette': {
      syntax: '*',
      inherits: false,
      initialValue: `'likec4.primary'`,
    },
    '--likec4-text-size': {
      syntax: '<length-percentage>',
      inherits: false,
      initialValue: '1rem',
    },
    '--likec4-spacing': {
      syntax: '<length-percentage>',
      inherits: false,
      initialValue: '1rem',
    },
    // '--xy-edge-stroke': {},
  },
  globalCss: {
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
      '--mantine-font-family': 'var(--likec4-app-font-default)',
      '--mantine-font-family-headings': 'var(--likec4-app-font-default)',
    },
    [`${root}`]: {
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      border: '0px solid transparent',
      // ['--likec4-app-font-default']:
      //   `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
      // ['--mantine-font-family']: 'var(--likec4-app-font-default)',
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
      transitionDuration: '800ms',
      transitionDelay: '200ms',
    },
    [`[data-mantine-color-scheme="dark"] ${rootNotReduced}:not([data-likec4-diagram-panning]) :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`]:
      {
        mixBlendMode: 'plus-lighter',
      },
    ...globalCss,
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

  utilities: {
    extend: {
      transition: {
        values: ['fast'],
        className: 'transition-fast',
        transform(value, { token }) {
          if (value !== 'fast') {
            return {
              transition: value,
            }
          }
          return {
            transition: `all ${token('durations.fast')}  ${token('easings.inOut')}`,
          }
        },
      },
      likec4Palette,
      likec4RelationPalette,
    },
  },

  theme,
})
