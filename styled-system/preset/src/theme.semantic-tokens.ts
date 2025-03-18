import { type Config, defineSemanticTokens } from '@pandacss/dev'

type ExtendableTheme = NonNullable<Config['theme']>

export const semanticTokens = defineSemanticTokens({
  fontSizes: {
    likec4: {
      textSize: {
        description: 'LikeC4 text size',
        value: {
          // base: 'var(--likec4-text-size, {fontSizes.likec4.md})',
          base: '{fontSizes.likec4.md}',
          // [`:where(.likec4-diagram-root) &`]: '{fontSizes.likec4.xl}',
        },
      },
    },
  },
  colors: {
    likec4: {
      mixColor: {
        description: 'Color to be used in color-mix',
        value: {
          base: 'white',
          _light: 'bilack',
        },
      },
    },
    xyedge: {
      stroke: {
        DEFAULT: {
          description: 'The stroke color of the XYEdge',
          value: {
            _likec4Color: '{colors.likec4.relation.line}',
            // _whenHovered: '{colors.xyedge.stroke.selected}',
            // _whenSelected: '{colors.xyedge.stroke.selected}',
          },
        },
        selected: {
          value: {
            _dark: {
              base: 'white',
              [':where([data-likec4-color]) &']: 'color-mix(in srgb, {colors.likec4.relation.line}, white 35%)',
            },
            // _likec4Color: {
            //   base: 'color-mix(in srgb, {colors.likec4.relation.line}, black 20%)',
            //   _dark: 'color-mix(in srgb, {colors.likec4.relation.line}, white 35%)',
            // },
            // // base: 'color-mix(in srgb, {colors.likec4.relation.line}, {colors.likec4.mixColor} 35%)',
            // _light: {
            //   _likec4Color: 'color-mix(in srgb, {colors.likec4.relation.line}, black 20%)',
            // },
            // _dark: {
            //   _likec4Color: 'color-mix(in srgb, {colors.likec4.relation.line}, white 35%)',
            // },
            // },
          },
        },
      },
    },
  },
})
