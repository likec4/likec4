import type { Config } from '@pandacss/dev'
import { root } from './const'
import { conditions as generated } from './generated'

type ExtendableConditions = NonNullable<Config['conditions']>

export const conditions = {
  extend: {
    ...generated,
    light: '[data-mantine-color-scheme="light"] &',
    dark: '[data-mantine-color-scheme="dark"] &',

    notDisabled: '&:not(:is(:disabled, [disabled], [data-disabled]))',

    // This is used to hide certain elements when the diagram is in reduced graphics mode (large)
    reduceGraphics: [
      `${root}:is([data-likec4-reduced-graphics])`,
      ' &',
    ].join(''),

    // This is used to improve performance when the diagram is in reduced graphics mode
    // and the user is panning around the diagram
    reduceGraphicsOnPan: [
      `${root}:is(`,
      '[data-likec4-reduced-graphics]',
      '[data-likec4-diagram-panning="true"]',
      ') &',
    ].join(''),

    noReduceGraphics: [
      `${root}:not(`,
      '[data-likec4-reduced-graphics]',
      ') &',
    ].join(''),

    whenPanning: `${root}:is([data-likec4-diagram-panning="true"]) &`,

    smallZoom: ':where([data-likec4-zoom-small="true"]) &',

    compoundTransparent: ':where([data-compound-transparent]) &',

    edgeActive: ':where([data-likec4-edge-active="true"]) &',

    whenHovered: ':where(.react-flow__node, .react-flow__edge):has([data-likec4-hovered="true"]) &',
    whenSelected: ':where(.react-flow__node, .react-flow__edge):is(.selected) &',
    whenDimmed: ':where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed]) &',
    whenFocused: ':where(.react-flow__node, .react-flow__edge):is(:focus-visible, :focus, :focus-within) &',
    // likec4Color: ':where([data-likec4-color]) &',
  },
} satisfies ExtendableConditions
