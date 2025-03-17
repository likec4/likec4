import { definePreset } from '@pandacss/dev'
import { conditions } from './conditions'
import { globalCss } from './generated'
import { theme } from './theme'

export default definePreset({
  name: 'likec4',
  // Whether to use css reset
  presets: [
    '@pandacss/preset-base',
    '@pandacss/preset-panda',
  ],
  globalVars: {
    // Override mantine font-size
    '--text-fz': {
      syntax: '<length>',
    },
    '--likec4-text-size': {
      syntax: '<length> | <percentage>',
      inherits: true,
    },
    '--likec4-spacing': {
      syntax: '<length> | <percentage>',
      inherits: true,
    },
    '--opacity': {
      syntax: '<number>',
    },
    // '--mix-color': {
    //   syntax: '<color>',
    // },
    // // '--action-btn-bg': {
    //   syntax: '<color>',
    // '--likec4-app-font': {
    //   syntax: '*',
    //   initialValue: 'var(--likec4-default-font)',
    // },
    // likec4: {
    //   background: {
    //     pattern: {
    //       color: mantine.colors.gray[4],
    //     },
    //   },
    // },
  },
  globalCss: {
    // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
    //   // TODO: this workaround disables animations in Safari (to improve performance)
    //   ['--likec4-safari-animation-hook']: ' ',
    // },
    '.likec4-diagram-root': {
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      ['--likec4-app-font-default']:
        `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
      ['--mantine-default-font-family']: 'var(--likec4-app-font)',
      ['--likec4-background-color']: 'var(--mantine-color-body)',
    },
    ':where(.likec4-diagram-root) .react-flow.not-initialized': {
      opacity: 0,
    },
    ':where(.likec4-diagram-root) .mantine-ActionIcon-icon .tabler-icon': {
      width: '75%',
      height: '75%',
    },
    '.likec4-diagram-root :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed="true"])': {
      opacity: 0.25,
      filter: 'auto',
      // transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      // transform; ''
      transitionProperty: 'opacity, filter',
      transitionTimingFunction: '{easings.inOut}',
      transitionDuration: '800ms',
      transitionDelay: '200ms',
      grayscale: 0.85,
      blur: '2px',
    },
    '.likec4-diagram-root :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed="immediate"])': {
      opacity: 0.25,
      filter: 'auto',
      grayscale: 0.85,
      blur: '2px',
    },
    '.likec4-diagram-root:is(:not([data-likec4-reduced-graphics])) :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg':
      {
        mixBlendMode: 'plus-lighter',
      },
    ':where([data-mantine-color-scheme="light"]) .likec4-diagram-root:is(:not([data-likec4-reduced-graphics])) :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg':
      {
        mixBlendMode: 'plus-lighter',
      },
    // globalStyle(`${reactFlow} `, {
    //
    // })
    // globalStyle(`${whereLight} ${reactFlow} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`, {
    //   mixBlendMode: 'screen',
    // })

    ...globalCss,
  },
  staticCss: {
    extend: {
      themes: ['light', 'dark'],
      // css: [{
      //   properties: staticCssIncludeProps,
      //   conditions: ['notReducedGraphics'],
      //   // }, {
      //   //   properties: {
      //   //     background: ['xyedge.label.bg'],
      //   //   },
      //   //   conditions: ['*'],
      // }],
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
    },
  },

  theme,
})
