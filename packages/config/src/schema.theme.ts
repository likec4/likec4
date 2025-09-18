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
} from '@likec4/core/styles'
import {
  type LikeC4ProjectStyleDefaults,
  type LikeC4ProjectStylesConfig,
  type LikeC4ProjectTheme,
  exact,
} from '@likec4/core/types'
import * as z from 'zod/v4'

const opacity = z
  .number()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')
  .meta({ description: 'Opacity 0%-100%' })

const shape = z.enum(ElementShapes)

const border = z.enum(BorderStyles)

const size = z.enum(Sizes)

const arrow = z.enum(RelationshipArrowTypes)
const line = z
  .enum(['dashed', 'solid', 'dotted'])
  .meta({ description: 'Default line type for relationships' })

const color = z
  .string()
  .nonempty('Color name cannot be empty')
  .transform(value => value as ThemeColor)
  .meta({ description: 'Theme color name (must be added to the theme)' })

const colorValue = z
  .string()
  .nonempty('Color value cannot be empty')
  .transform(value => value as ColorLiteral)
  .meta({ description: 'Color value: hex, rgb or rgba' })

// const ColorSchema = z.union([ColorValue, LightDarkTuple])
const colorSchema = colorValue
type ColorValue = z.infer<typeof colorSchema>

const ElementColorValuesSchema = z
  .object({
    fill: colorSchema.meta({ description: 'Background color' }),
    stroke: colorSchema.meta({ description: 'Stroke color (border, paths above background)' }),
    hiContrast: colorSchema.meta({ description: 'High contrast text color (title)' }),
    loContrast: colorSchema.meta({ description: 'Low contrast text color (description)' }),
  })
  .meta({ description: 'Element colors' })
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
  .meta({ description: 'Edge colors' })
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
  .meta({ description: 'Theme color or color values' })
  .transform((value): ThemeColorValues => {
    if (typeof value === 'string') {
      return computeColorValues(value)
    }
    return value
  })
export type ThemeColorValuesInput = z.input<typeof ThemeColorValuesSchema>

const ThemeColorsSchema = z
  .record(
    color,
    ThemeColorValuesSchema,
  )
  .meta({
    description: 'Map of theme colors.',
  })

export const LikeC4Config_Styles_Theme = z
  .object({
    colors: ThemeColorsSchema,
    sizes: z
      .partialRecord(
        size,
        z.object({
          width: z.number().min(100),
          height: z.number().min(100),
        }),
      )
      .meta({ description: 'Map of theme sizes.' }),
  })
  .partial()
  .meta({ description: 'Theme customization' })
  .transform((value): LikeC4ProjectTheme => {
    return exact(value)
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
  .meta({ description: 'Default style values for elements, groups and relationships' })

export const LikeC4StylesConfigSchema = z
  .object({
    theme: LikeC4Config_Styles_Theme,
    defaults: LikeC4Config_Styles_Defaults,
    customCss: z
      .array(z.string())
      .meta({ description: 'List of custom CSS files' }),
  })
  .partial()
  .meta({ description: 'Project styles configuration' })
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
