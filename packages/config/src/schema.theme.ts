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
  .number()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')
  .meta({
    id: 'Opacity',
    description: 'Opacity 0%-100%',
  })

const shape = z.literal(ElementShapes).meta({
  id: 'ElementShape',
  description: 'Element shape',
})

const border = z.literal(BorderStyles).meta({
  id: 'BorderStyle',
  description: 'Border style',
})

const size = z.literal(Sizes).meta({
  id: 'ElementSize',
  description: 'Element size',
})

const arrow = z.literal(RelationshipArrowTypes).meta({
  id: 'ArrowType',
  description: 'Relationship arrow type',
})
const line = z
  .literal(['dashed', 'solid', 'dotted'])
  .meta({
    id: 'LineType',
    description: 'Default line type for relationships',
  })

const themeColor = z.literal(ThemeColors).meta({
  id: 'ThemeColor',
  description: 'Reserved theme color name',
})

const color = z.union([
  themeColor,
  z.string().nonempty('Color name cannot be empty'),
])
  .transform(value => value as ThemeColor)
  .meta({
    id: 'ColorName',
    description: 'Color name (Theme color name or custom color name)',
  })

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
  .object({
    fill: colorSchema.meta({ description: 'Background color' }),
    stroke: colorSchema.meta({ description: 'Stroke color (border, paths above background)' }),
    hiContrast: colorSchema.meta({ description: 'High contrast text color (title)' }),
    loContrast: colorSchema.meta({ description: 'Low contrast text color (description)' }),
  })
  .meta({
    id: 'ElementColorValues',
    description: 'Specific element colors',
  })
  .transform(value => value as ElementColorValues)

const RelationshipColorValuesSchema = z
  .object({
    line: colorSchema.meta({ description: 'Line color' }),
    label: colorSchema.meta({ description: 'Label text color' }),
    labelBg: colorSchema
      .optional()
      .default('rgba(0, 0, 0, 0)')
      .meta({ description: 'Label background color' }),
  })
  .meta({
    id: 'RelationshipColorValues',
    description: 'Specefic relationship colors',
  })
  .transform(value => value as RelationshipColorValues)

export const ThemeColorValuesSchema = z
  .union([
    colorSchema,
    z.object({
      elements: z
        .union([colorSchema, ElementColorValuesSchema])
        .transform((value): ElementColorValues => {
          if (typeof value === 'string') {
            return computeColorValues(value).elements
          }
          return value
        }),
      relationships: z
        .union([colorSchema, RelationshipColorValuesSchema])
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
  description: 'Override of theme colors',
})

const DimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
}).meta({
  id: 'Dimensions',
  description: 'Dimensions',
})

export const LikeC4Config_Styles_Theme = z
  .object({
    colors: ThemeColorsSchema,
    sizes: z
      .object(fromKeys(Sizes, () => DimensionsSchema.optional()))
      .meta({ description: 'Map of theme sizes.' }),
  })
  .partial()
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

const LikeC4Config_Styles_Defaults = z
  .object({
    color,
    opacity,
    border,
    size,
    shape,
    group: z.object({
      color,
      opacity,
      border,
    }).partial(),
    relationship: z.object({
      color,
      line,
      arrow,
    }).partial(),
  })
  .partial()
  .meta({
    id: 'DefaultStyleValues',
    description:
      'Override default values for style properties\nThese values will be used if such property is not defined',
  })

export const LikeC4StylesConfigSchema = z
  .object({
    theme: LikeC4Config_Styles_Theme,
    defaults: LikeC4Config_Styles_Defaults,
    // customCss: z
    //   .array(z.string())
    //   .meta({ description: 'List of custom CSS files' }),
  })
  .partial()
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
