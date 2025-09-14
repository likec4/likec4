import type { Config } from '@pandacss/dev'
import { generatedGlobalCss } from './generated'

type ExtendableGlobalCss = NonNullable<Config['globalCss']>

export const globalCss: ExtendableGlobalCss = {
  extend: {
    // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
    //   // TODO: this workaround disables animations in Safari (to improve performance)
    //   ['--likec4-safari-animation-hook']: '/*-*/ /*-*/',
    // },
    ':where(:root,:host)': {
      ['--likec4-app-font-default']:
        `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
    },
    ...generatedGlobalCss,

    '.likec4-shadow-root': {
      display: 'contents',
      '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
      '--mantine-font-family-headings': 'var(--likec4-app-font, var(--likec4-app-font-default))',

      '& dialog': {
        color: 'var(--mantine-color-text)',
      },
    },

    '.likec4-edge-label-container': {
      top: 0,
      left: 0,
      position: 'absolute',
      width: 'auto',
      height: 'auto',
      display: {
        _reduceGraphicsOnPan: 'none',
        _smallZoom: 'none',
      },
    },

    '.likec4-root': {
      overflow: 'hidden',
      position: 'relative',
      padding: 0,
      margin: 0,
      width: '100%',
      height: '100%',
      border: '0px solid transparent',
      containerName: 'likec4-root',
      containerType: 'size',

      '& .mantine-ActionIcon-icon .tabler-icon': {
        width: '75%',
        height: '75%',
      },

      '& .react-flow': {
        contain: 'paint',
        '--xy-background-color': 'var(--colors-likec4-background)',
        '--xy-background-pattern-color': 'var(--colors-likec4-background-pattern, var(--colors-likec4-background))',
        '&:is(.not-initialized)': {
          opacity: 0,
        },
        '&:is(.bg-transparent)': {
          background: 'transparent !important',
          '--xy-background-color': 'transparent !important',
        },
        '& .react-flow__pane': {
          userSelect: 'none',
        },
        '& :where(.react-flow__nodes, .react-flow__edges, .react-flow__edgelabel-renderer)': {
          display: 'contents',
        },
        '& .react-flow__node.draggable:has(.likec4-compound-node)': {
          cursor: 'default',
        },
      },
      '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed])': {
        opacity: 0.25,
      },
      '& .likec4-edge-label-container:is([data-likec4-dimmed])': {
        opacity: 0.25,
      },

      '& :where(.react-flow__edge, .likec4-edge-container, .likec4-edge-label-container)': {
        '--xy-edge-stroke-width': 3,
        '--xy-edge-stroke': 'var(--likec4-palette-relation-stroke)',
        '--xy-edge-stroke-selected': 'var(--likec4-palette-relation-stroke-selected)',
        '--xy-edge-label-color': 'var(--likec4-palette-relation-label)',
        '--xy-edge-label-background-color': 'var(--likec4-palette-relation-label-bg)',

        _dark: {
          '--xy-edge-label-background-color':
            'color-mix(in srgb, var(--likec4-palette-relation-label-bg) 50%, transparent)',
        },
        _light: {
          '--xy-edge-label-color':
            'color-mix(in srgb, var(--likec4-palette-relation-label), rgba(255 255 255 / 0.85) 40%)',
          '--xy-edge-label-background-color':
            'color-mix(in srgb, var(--likec4-palette-relation-label-bg) 60%, transparent)',
        },

        '&:is([data-likec4-hovered="true"], [data-edge-active="true"])': {
          '--xy-edge-stroke-width': 4,
          '--xy-edge-stroke': 'var(--likec4-palette-relation-stroke-selected)',
        },
      },

      '&:is([data-likec4-reduced-graphics]) .hide-on-reduced-graphics': {
        display: 'none',
      },

      '&:not([data-likec4-reduced-graphics])': {
        '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed])': {
          filter: 'grayscale(85%)',
        },
        '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed="true"])': {
          transitionProperty: 'opacity, filter',
          transitionTimingFunction: 'cubic-bezier(0.50, 0, 0.2, 1)',
          transitionDuration: '400ms',
        },
        '& .likec4-edge-label-container:is([data-likec4-dimmed])': {
          filter: 'grayscale(85%)',
        },
        '& .likec4-edge-label-container:is([data-likec4-dimmed="true"])': {
          transitionProperty: 'opacity, filter',
          transitionTimingFunction: 'cubic-bezier(0.50, 0, 0.2, 1)',
          transitionDuration: '400ms',
        },
        '& :where(.react-flow__edges, .react-flow__edgelabel-renderer) > :where(svg, .likec4-edge-label-container)': {
          mixBlendMode: {
            _dark: 'plus-lighter',
            _light: 'screen',
          },
        },
        '&:has(.react-flow__node-seq-parallel) :where(.react-flow__edges > svg)': {
          mixBlendMode: {
            // _dark: 'plus-lighter',
            _light: 'color-burn',
          },
        },
        '& .react-flow__node-seq-parallel': {
          mixBlendMode: {
            _dark: 'luminosity',
            _light: 'color-burn',
          },
        },
      },
    },

    '.likec4-static-view .react-flow .react-flow__attribution': {
      display: 'none',
    },
  },
}
