import type { Config } from '@pandacss/dev'
import { keys, mapToObj } from 'remeda'
import { __v, vars } from './const.ts'
import { defaultTheme } from './defaults/index.ts'

type ExtendableGlobalCss = NonNullable<Config['globalCss']>

const sizeConditions = {
  ...mapToObj(keys(defaultTheme.textSizes), (size) =>
    [
      `:where([data-likec4-text-size='${size}'])`,
      {
        [vars.textsize]: `{fontSizes.likec4.${size}}`,
      },
    ] satisfies [string, Record<string, string>]),
  ...mapToObj(keys(defaultTheme.spacing), (size) =>
    [
      `:where([data-likec4-spacing='${size}'])`,
      {
        [vars.spacing]: `{spacing.likec4.${size}}`,
      },
    ] satisfies [string, Record<string, string>]),
}

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

    ...sizeConditions,
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
      background: 'transparent',
      containerName: 'likec4-root',
      containerType: 'size',
      _print: {
        '& .react-flow__background': {
          display: 'none',
        },
        '& .react-flow': {
          background: 'transparent !important',
          '--xy-background-color': 'transparent !important',
        },
        '& *': {
          colorAdjust: 'exact!',
          printColorAdjust: 'exact!',
        },
      },

      '& .mantine-ActionIcon-icon .tabler-icon': {
        width: '75%',
        height: '75%',
      },

      '& .react-flow': {
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

        '& .likec4-node-handle-center': {
          top: '50%!',
          left: '50%!',
          right: 'unset!',
          bottom: 'unset!',
          visibility: 'hidden!',
          width: '5px!',
          height: '5px!',
          transform: 'translate(-50%, -50%)!',
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
        '--xy-edge-stroke': __v('palette.relationStroke'),
        '--xy-edge-stroke-selected': __v('palette.relationStrokeSelected'),
        '--xy-edge-label-color': __v('palette.relationLabel'),
        '--xy-edge-label-background-color': __v('palette.relationLabelBg'),

        _dark: {
          '--xy-edge-label-background-color': `color-mix(in oklab, ${__v('palette.relationLabelBg')} 50%, transparent)`,
        },
        _light: {
          '--xy-edge-label-color': `color-mix(in oklab, ${__v('palette.relationLabel')}, #FFF 50%)`,
          '--xy-edge-label-background-color': `color-mix(in oklab, ${__v('palette.relationLabelBg')} 65%, transparent)`,
        },

        '&:is([data-likec4-hovered="true"], [data-edge-active="true"])': {
          '--xy-edge-stroke-width': 4,
          '--xy-edge-stroke': __v('palette.relationStrokeSelected'),
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
        '& :where(.react-flow__edgelabel-renderer) > *': {
          mixBlendMode: {
            _dark: 'screen',
            _light: 'hard-light',
            _print: 'normal!',
          },
        },
        '& :where(.react-flow__edges) > svg': {
          mixBlendMode: {
            _dark: 'plus-lighter',
            _light: 'multiply',
            _print: 'normal!',
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
            _print: 'normal!',
          },
        },
      },

      '& :where(.relationships-browser, .likec4-relationship-details) .react-flow__attribution': {
        display: 'none',
      },
    },

    '.likec4-static-view .react-flow .react-flow__attribution': {
      display: 'none',
    },
  },
}
