import {
  type Color,
  type ColorLiteral,
  BorderStyles,
  ElementShapes,
  RelationshipArrowTypes,
  Sizes,
} from '@likec4/core/styles'
import * as z from 'zod/v4'

const opacity = z
  .number()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')
const shape = z.enum(ElementShapes)
const border = z.enum(BorderStyles)
const size = z.enum(Sizes)

const arrow = z.enum(RelationshipArrowTypes)
const line = z.enum(['dashed', 'solid', 'dotted'])

const color = z
  .string()
  .nonempty('Color name cannot be empty')
  .transform(value => value as Color)
  .meta({ description: 'Color name' })

const colorValue = z
  .string()
  .nonempty('Color value cannot be empty')
  .transform(value => value as ColorLiteral)
  .meta({ description: 'Color value: hex, rgb or rgba' })

// const ColorSchema = z.union([ColorValue, LightDarkTuple])
const colorSchema = colorValue
export type ColorValue = z.infer<typeof colorSchema>

export const ElementColorValuesSchema = z.object({
  fill: colorSchema.meta({ description: 'Background color' }),
  stroke: colorSchema.meta({ description: 'Stroke color (border, paths above background)' }),
  hiContrast: colorSchema.meta({ description: 'High contrast text color (title)' }),
  loContrast: colorSchema.meta({ description: 'Low contrast text color (description)' }),
}).meta({ description: 'Element colors' })

export const EdgeColorValuesSchema = z.object({
  line: colorSchema.meta({ description: 'Line color' }),
  label: colorSchema.meta({ description: 'Label text color' }),
  labelBg: colorSchema.optional().meta({ description: 'Label background color' }),
}).meta({ description: 'Edge colors' })

export const ThemeColorValuesSchema = z.object({
  elements: z.union([colorSchema, ElementColorValuesSchema]),
  relationships: z.union([colorSchema, EdgeColorValuesSchema]),
})
export type ThemeColorValues = z.infer<typeof ThemeColorValuesSchema>
export type ThemeColorValuesInput = z.input<typeof ThemeColorValuesSchema>

// export const ThemeColorsSchema = z
//   .union([
//     z.object({
//       ...fromKeys(ThemeColors, (key) => z.union([colorSchema, ThemeColorValuesSchema])),
//     })
//       .partial(),
//     z.record(
//       z.string(),
//       z.union([colorSchema, ThemeColorValuesSchema]),
//     ),
// ])
export const ThemeColorsSchema = z.partialRecord(
  color,
  z.union([colorSchema, ThemeColorValuesSchema]),
).meta({
  description: 'Map of theme colors.',
})
export interface LikeC4ThemeColorsConfig extends z.infer<typeof ThemeColorsSchema> {}
export type LikeC4ThemeColorsConfigInput = z.input<typeof ThemeColorsSchema>

export const ThemeConfigSchema = z
  .object({
    colors: ThemeColorsSchema.transform(value => value as LikeC4ThemeColorsConfig),
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

export interface LikeC4ThemeConfig extends z.infer<typeof ThemeConfigSchema> {}
export type LikeC4ThemeConfigInput = z.input<typeof ThemeConfigSchema>

export const LikeC4StylesConfigSchema = z
  .object({
    theme: ThemeConfigSchema.transform(value => value as LikeC4ThemeConfig),
    defaults: z
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
      .meta({ description: 'Default style values for elements, groups and relationships' }),
    customCss: z
      .array(z.string())
      .meta({ description: 'List of custom CSS files' }),
  })
  .partial()
  .meta({ description: 'Styles configuration' })

export interface LikeC4StylesConfig extends z.infer<typeof LikeC4StylesConfigSchema> {}
export type LikeC4StylesConfigInput = z.input<typeof LikeC4StylesConfigSchema>
