import type { Config } from '@pandacss/dev'
import { conditions as generated } from './generated'

type ExtendableConditions = NonNullable<Config['conditions']>

export const conditions = {
  extend: {
    light: ':where([data-mantine-color-scheme="light"]) &',
    dark: ':where([data-mantine-color-scheme="dark"]) &',

    reducedGraphics: '.likec4-diagram-root:is([data-likec4-reduced-graphics="true"]) &',
    notReducedGraphics: '.likec4-diagram-root:is(:not([data-likec4-reduced-graphics])) &',
    smallZoom: ':where([data-likec4-zoom-small="true"]) &',

    // compoundTransparent: '&[data-compound-transparent="true"], :where([data-compound-transparent="true"]) &',
    compoundTransparent: ':where([data-compound-transparent="true"]) &',

    edgeActive: ':where([data-likec4-edge-active="true"]) &',

    whenHovered: ':where([data-likec4-hovered="true"]) &',
    whenSelected: ':where(.react-flow__node.selected, .react-flow__edge.selected) &',
    whenDimmed: ':where([data-likec4-dimmed="true"]) &',
    whenDimmedImmediate: ':where([data-likec4-dimmed="immediate"]) &',
    ...generated,
  },
} satisfies ExtendableConditions
