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
          [`:where(.likec4-diagram-root) &`]: '{fontSizes.likec4.xl}',
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
          _dark: 'black',
        },
      },
    },
    xyedge: {
      label: {
        DEFAULT: {
          description: 'The label color of the XYEdge',
          value: {
            base: '{colors.likec4.relation.label}',
            _light: `color-mix(in srgb, {colors.likec4.relation.label}, rgba(255 255 255 / 0.85) 40%)`,
            // _notReducedGraphics: {
            //   _light: ,
            // },
          },
        },
        bg: {
          value: {
            base: '{colors.likec4.relation.label.bg}',
            // _notReducedGraphics: {
            _light: `color-mix(in srgb, {colors.likec4.relation.label.bg}, transparent 40%)`,
            _dark: `color-mix(in srgb, {colors.likec4.relation.label.bg}, transparent 50%)`,
            // },
          },
        },
      },
      stroke: {
        DEFAULT: {
          description: 'The stroke color of the XYEdge',
          value: {
            base: '{colors.likec4.relation.line}',
            _whenHovered: '{colors.xyedge.stroke.selected}',
            _whenSelected: '{colors.xyedge.stroke.selected}',
          },
        },
        selected: {
          value: {
            base: 'color-mix(in srgb, {colors.likec4.relation.line}, {colors.likec4.mixColor} 35%)',
            _dark: 'color-mix(in srgb, {colors.likec4.relation.line}, white 35%)',
            _light: 'color-mix(in srgb, {colors.likec4.relation.line}, black 20%)',
          },
        },
      },
    },
  },
})
