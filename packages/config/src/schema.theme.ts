import { type ThemeColor, BorderStyles } from '@likec4/core/types'
import * as z from 'zod4'

const opacity = z
  .number()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')

const border = z.enum(BorderStyles)
const line = z.enum(['dashed', 'solid', 'dotted'])

const colorName = z
  .string()
  .nonempty('Color name cannot be empty')
  .transform(value => value as ThemeColor)
  .meta({ description: 'Color name' })

const ColorValue = z
  .string()
  .nonempty('Color value cannot be empty')
  .meta({ description: 'Color value' })

const LightDarkTuple = z.tuple([ColorValue, ColorValue]).meta({ description: 'Color values for light and dark modes' })

// const ColorSchema = z.union([ColorValue, LightDarkTuple])
const ColorSchema = ColorValue
export type ColorValue = z.infer<typeof ColorSchema>

export const ElementColorValuesSchema = z.object({
  fill: ColorSchema.meta({ description: 'Background color' }),
  stroke: ColorSchema.meta({ description: 'Stroke color (border, paths above background)' }),
  hiContrast: ColorSchema.meta({ description: 'High contrast text color (title)' }),
  loContrast: ColorSchema.meta({ description: 'Low contrast text color (description)' }),
}).meta({ description: 'Element colors' })
export type ElementColorValues = z.infer<typeof ElementColorValuesSchema>

export const EdgeColorValuesSchema = z.object({
  line: ColorSchema.meta({ description: 'Line color' }),
  label: ColorSchema.meta({ description: 'Label text color' }),
  labelBg: ColorSchema.optional().meta({ description: 'Label background color' }),
}).meta({ description: 'Edge colors' })
export type EdgeColorValues = z.infer<typeof EdgeColorValuesSchema>

export const ThemeColorValuesSchema = z.object({
  elements: z.union([ColorSchema, ElementColorValuesSchema]),
  relationships: z.union([ColorSchema, EdgeColorValuesSchema]),
})
export type ThemeColorValues = z.infer<typeof ThemeColorValuesSchema>

export const ThemeColorsSchema = z.record(
  z.string(),
  z.union([ColorSchema, ThemeColorValuesSchema]),
).meta({
  description: 'Map of theme colors.',
})

export const ThemeConfigSchema = z.object({
  colors: ThemeColorsSchema,
}).partial().meta({ description: 'Theme customization' })

export interface LikeC4ThemeConfig extends z.infer<typeof ThemeConfigSchema> {}
export type ThemeConfigInput = z.input<typeof ThemeConfigSchema>

export const StylesConfigSchema = z
  .object({
    theme: ThemeConfigSchema.transform(value => value as LikeC4ThemeConfig),
    defaults: z.object({
      element: z.object({
        color: colorName,
        opacity: opacity,
        border: border,
      }).partial(),
      group: z.object({
        color: colorName,
        opacity: opacity,
        border: border,
      }).partial(),
      relationship: z.object({
        color: colorName,
        line: line,
      }).partial(),
    }).partial().meta({ description: 'Default style values for elements, groups and relationships' }),
    customCss: z.array(z.string()).meta({ description: 'List of custom CSS files' }),
  })
  .partial()
  .meta({ description: 'Styles configuration' })

export type LikeC4StylesConfig = z.infer<typeof StylesConfigSchema>
export type StylesConfigInput = z.input<typeof StylesConfigSchema>
