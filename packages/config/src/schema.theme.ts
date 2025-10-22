import {
  type ColorLiteral,
  type ElementColorValues,
  type RelationshipColorValues,
  type ThemeColor,
  type ThemeColorValues,
  BorderStyles,
  computeColorValues,
  ElementShapes,
  RelationshipArrowTypes,
  Sizes,
  ThemeColors,
} from '@likec4/core/styles'
import {
  type LikeC4ProjectStyleDefaults,
  type LikeC4ProjectStylesConfig,
  type LikeC4ProjectTheme,
  exact,
} from '@likec4/core/types'
import { fromKeys } from 'remeda'
import * as z from 'zod'

const opacity = z
  .int()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')
  .meta({
    id: 'Opacity',
    description: 'Opacity 0-100%',
  })

const shape = z
  .literal(ElementShapes)
  .meta({ id: 'ElementShape' })

const border = z
  .literal(BorderStyles)
  .meta({ id: 'BorderStyle' })

const size = z
  .literal(Sizes)
  .meta({ id: 'ElementSize' })

const arrow = z
  .literal(RelationshipArrowTypes)
  .meta({ id: 'ArrowType' })

const line = z
  .literal(['dashed', 'solid', 'dotted'])
  .meta({ id: 'LineType' })

const themeColor = z
  .literal(ThemeColors)
  .meta({ id: 'ThemeColor' })

const color = z
  .union([
    themeColor,
    z.string().nonempty('Color name cannot be empty'),
  ])
  .transform(value => value as ThemeColor)
  .meta({ id: 'ColorName' })

const colorValue = z
  .string()
  .nonempty('Color value cannot be empty')
  .transform(value => value as ColorLiteral)
  .meta({
    id: 'ColorLiteral',
    description: 'Color value in any valid CSS format: hex, rgb, rgba, hsl, hsla ...',
  })

// const ColorSchema = z.union([ColorValue, LightDarkTuple])
const colorSchema = colorValue
// type ColorValue = z.infer<typeof colorSchema>

const ElementColorValuesSchema = z
  .strictObject({
    fill: colorSchema.meta({ description: 'Background color' }),
    stroke: colorSchema.meta({ description: 'Stroke color (border, paths above background)' }),
    hiContrast: colorSchema.meta({ description: 'High contrast text color (title)' }),
    loContrast: colorSchema.meta({ description: 'Low contrast text color (description)' }),
  })
  .meta({ id: 'ElementColorValues' })
  .transform(value => value as ElementColorValues)

const RelationshipColorValuesSchema = z
  .strictObject({
    line: colorSchema.meta({ description: 'Line color' }),
    label: colorSchema.meta({ description: 'Label text color' }),
    labelBg: colorSchema
      .optional()
      .default('rgba(0, 0, 0, 0)')
      .meta({ description: 'Label background color' }),
  })
  .meta({ id: 'RelationshipColorValues' })
  .transform(value => value as RelationshipColorValues)

export const ThemeColorValuesSchema = z
  .union([
    colorSchema,
    z.strictObject({
      elements: z
        .union([colorSchema, ElementColorValuesSchema])
        .meta({ description: 'Element color value (or a breakdown of specific color values)' })
        .transform((value): ElementColorValues => {
          if (typeof value === 'string') {
            return computeColorValues(value).elements
          }
          return value
        }),
      relationships: z
        .union([colorSchema, RelationshipColorValuesSchema])
        .meta({ description: 'Relationship color value (or a breakdown of specific color values)' })
        .transform((value): RelationshipColorValues => {
          if (typeof value === 'string') {
            return computeColorValues(value).relationships
          }
          return value
        }),
    }),
  ])
  .meta({
    id: 'ThemeColorValues',
    description: 'Exact value (hex, rgb, rgba, hsl, hsla ...) or break down of specific color values',
  })
  .transform((value): ThemeColorValues => {
    if (typeof value === 'string') {
      return computeColorValues(value)
    }
    return value
  })
export type ThemeColorValuesInput = z.input<typeof ThemeColorValuesSchema>

const ThemeColorsSchema = z.union([
  z.record(
    color,
    ThemeColorValuesSchema,
  ),
  z.object(
    fromKeys(ThemeColors, () => ThemeColorValuesSchema.optional()),
  ),
]).meta({
  id: 'ThemeColors',
  description: 'Override theme colors',
})

const DimensionsSchema = z.strictObject({
  width: z.number().min(50),
  height: z.number().min(50),
}).meta({
  id: 'Dimensions',
  description: 'Dimensions',
})

const LikeC4Config_Styles_Theme_Sizes = z
  .strictObject(
    fromKeys(Sizes, () => DimensionsSchema.optional()),
  )
  .meta({
    id: 'ThemeSizes',
    description: 'Override theme sizes',
  })

export const LikeC4Config_Styles_Theme = z
  .strictObject({
    colors: ThemeColorsSchema.optional(),
    sizes: LikeC4Config_Styles_Theme_Sizes.optional(),
  })
  .meta({
    id: 'ThemeCustomization',
    description: 'Theme customization',
  })
  .transform(({ colors, sizes }): LikeC4ProjectTheme => {
    return exact({
      colors: colors ? exact(colors) satisfies LikeC4ProjectTheme['colors'] : undefined,
      sizes: sizes ? exact(sizes) satisfies LikeC4ProjectTheme['sizes'] : undefined,
    })
  })
export type LikeC4ConfigThemeInput = z.input<typeof LikeC4Config_Styles_Theme>

const LikeC4Config_Styles_Defaults_Group = z
  .strictObject({
    color: color.optional().meta({
      description: 'Default color for groups\n(must be a valid color name from the theme)',
    }),
    opacity: opacity.optional().meta({ description: 'Default opacity for groups' }),
    border: border.optional().meta({ description: 'Default border for groups' }),
  })
  .meta({
    id: 'GroupDefaultStyleValues',
    description:
      'Override default values for group style properties\nThese values will be used if such property is not defined',
  })

const LikeC4Config_Styles_Defaults_Relationship = z
  .strictObject({
    color: color.optional().meta({
      description: 'Default color for relationships\n(must be a valid color name from the theme)',
    }),
    line: line.optional().meta({ description: 'Default line style for relationships' }),
    arrow: arrow.optional().meta({ description: 'Default arrow style for relationships' }),
  })
  .meta({
    id: 'RelationshipDefaultStyleValues',
    description:
      'Override default values for relationship style properties\nThese values will be used if such property is not defined',
  })

const LikeC4Config_Styles_Defaults = z
  .strictObject({
    color: color.optional().meta({
      description: 'Default color for elements\n(must be a valid color name from the theme)',
    }),
    opacity: opacity.optional().meta({
      description: 'Default opacity (0-100%) for elements when displayed as a group (like a container)',
    }),
    border: border.optional().meta({
      description: 'Default border style for elements when displayed as a group (like a container)',
    }),
    size: size.optional().meta({ description: 'Default size for elements' }),
    shape: shape.optional().meta({ description: 'Default shape for elements' }),
    group: LikeC4Config_Styles_Defaults_Group.optional().meta({ description: 'Default style values for groups' }),
    relationship: LikeC4Config_Styles_Defaults_Relationship.optional().meta({
      description: 'Default style values for relationships',
    }),
  })
  .meta({
    id: 'DefaultStyleValues',
    description:
      'Override default values for style properties\nThese values will be used if such property is not defined',
  })

export const LikeC4StylesConfigSchema = z
  .strictObject({
    theme: LikeC4Config_Styles_Theme.optional(),
    defaults: LikeC4Config_Styles_Defaults.optional(),
    // customCss: z
    //   .array(z.string())
    //   .meta({ description: 'List of custom CSS files' }),
  })
  .meta({
    id: 'StylesConfiguration',
    description: 'Project styles customization',
  })
  .transform(({ theme, defaults }): LikeC4ProjectStylesConfig =>
    exact({
      defaults: normalizeDefaults(defaults),
      theme,
    })
  )

export interface LikeC4StylesConfig extends z.infer<typeof LikeC4StylesConfigSchema> {}
export type LikeC4StylesConfigInput = z.input<typeof LikeC4StylesConfigSchema>

function normalizeDefaults(
  defaults?: z.infer<typeof LikeC4Config_Styles_Defaults>,
): LikeC4ProjectStyleDefaults | undefined {
  if (!defaults) {
    return undefined
  }
  const { relationship, group, ...rest } = defaults
  return exact({
    ...rest,
    relationship: relationship && exact(relationship) as LikeC4ProjectStyleDefaults['relationship'],
    group: group && exact(group) as LikeC4ProjectStyleDefaults['group'],
  })
}
