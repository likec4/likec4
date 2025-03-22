import type { Config } from '@pandacss/dev'
import { conditions as generated } from './generated'

type ExtendableConditions = NonNullable<Config['conditions']>

export const conditions = {
  extend: {
    light: '[data-mantine-color-scheme="light"] &',
    dark: '[data-mantine-color-scheme="dark"] &',

    // This is used to hide certain elements when the diagram is in reduced graphics mode (large)
    reduceGraphics: [
      '.likec4-diagram-root:is([data-likec4-reduced-graphics="true"])',
      ' &',
    ].join(''),

    // This is used to improve performance when the diagram is in reduced graphics mode
    // and the user is panning around the diagram
    reduceGraphicsOnPan: [
      '.likec4-diagram-root:is(',
      '[data-likec4-reduced-graphics="true"]',
      '[data-likec4-diagram-panning]',
      ') &',
    ].join(''),

    noReduceGraphics: [
      '.likec4-diagram-root:not(',
      '[data-likec4-reduced-graphics]',
      ') &',
    ].join(''),

    whenPanning: ':is(.likec4-diagram-root[data-likec4-diagram-panning]) &',

    smallZoom: ':where([data-likec4-zoom-small="true"]) &',

    compoundTransparent: ':where([data-compound-transparent="true"]) &',

    edgeActive: ':where([data-likec4-edge-active="true"]) &',

    whenHovered: ':where([data-likec4-hovered="true"]) &',
    whenSelected: ':where(.react-flow__node.selected, .react-flow__edge.selected) &',
    whenDimmed: ':where([data-likec4-dimmed]) &',
    whenFocused: ':is(.react-flow__node, .react-flow__edge):focus-visible &',

    // likec4Color: ':where([data-likec4-color]) &',
    ...generated,
  },
} satisfies ExtendableConditions
