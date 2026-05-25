import type { Config } from '@pandacss/dev'
import { capitalize, mapKeys, mapToObj, mapValues, pipe } from 'remeda'
import { root } from './const.ts'
import { defaultTheme, ElementShapes } from './defaults/index.ts'

type ExtendableConditions = NonNullable<Config['conditions']>

const shapeSizeCondition = <const K extends string>(key: K): `${'shapeSize'}${Capitalize<K>}` =>
  `shapeSize${capitalize(key)}`

export const conditions = {
  extend: {
    ...pipe(
      defaultTheme.sizes,
      mapValues((_, key) => `:where([data-likec4-shape-size='${key}']) &`),
      mapKeys(shapeSizeCondition),
    ),
    ...mapToObj(ElementShapes, (shape) => [
      'shape' + capitalize(shape),
      `:where([data-likec4-shape='${shape}']) &`,
    ]),
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

    whenHovered: ':where([data-likec4-hovered="true"]) &',
    whenSelectable: ':where(.react-flow__node, .react-flow__edge, .likec4-edge-container):is(.selectable) &',
    whenSelected: ':where(.react-flow__node, .react-flow__edge, .likec4-edge-container):is(.selected) &',
    whenDimmed: ':where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed]) &',
    whenFocused: ':where(.react-flow__node, .react-flow__edge):is(:focus-visible, :focus, :focus-within) &',
    // likec4Color: ':where([data-likec4-color]) &',
  },
} satisfies ExtendableConditions
