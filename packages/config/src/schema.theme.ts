// oxlint-disable no-unsafe-type-assertion
import type {
  ElementColorValues,
  RelationshipColorValues,
  ThemeColorValues,
} from '@likec4/core/styles'
import {
  BorderStyles,
  computeColorValues,
  ElementShapes,
  IconPositions,
  RelationshipArrowTypes,
  Sizes,
  ThemeColors,
} from '@likec4/core/styles'
import type {
  ColorLiteral,
  CustomColor,
  LikeC4ProjectStyleDefaults,
  LikeC4ProjectStylesConfig,
  LikeC4ProjectStylesCustomStylesheets,
  LikeC4ProjectTheme,
  ThemeColor,
} from '@likec4/core/types'
import { exact } from '@likec4/core/types'
import z from 'zod/v4'

const opacity = z
  .int()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')
  .meta({
    id: 'Opacity',
    description: 'Opacity 0-100%',
  })

const shape = z
  .enum(ElementShapes)
  .meta({ id: 'ElementShape' })

const border = z
  .enum(BorderStyles)
  .meta({ id: 'BorderStyle' })

const size = z
  .enum(Sizes)
  .meta({ id: 'ElementSize' })

const iconPosition = z
  .enum(IconPositions)
  .meta({ id: 'IconPosition' })

const arrow = z
  .enum(RelationshipArrowTypes)
  .meta({ id: 'ArrowType' })

const line = z
  .enum(['dashed', 'solid', 'dotted'])
  .meta({ id: 'LineType' })

const themeColor = z
  .enum(ThemeColors)
  .meta({ id: 'ThemeColorName' })

const customColor = z
  .custom<string & Record<never, never>>()
  .refine(v => typeof v === 'string', 'Custom color name must be a string')
  .transform(value => value as unknown as CustomColor)
  .meta({ id: 'CustomColorName' })

// const color = z.custom<ColorNameLiteral>(
//   (v) => {
//     if (typeof v !== 'string' || v.length === 0) {
//       throw new Error()
//     }
//     return v
//   },
//   {
//     error: 'Invalid color name',
//   },
// )
//   .meta({ id: 'ColorName' })

const color = themeColor.or(customColor)
  .transform(value => value as ThemeColor)
  .meta({ id: 'ColorName' })
// const color = themeColor.or(
//   // z.never(),
//   z.string().spa(),
// ).meta({ id: 'ColorName' })
// // .custom<ColorNameLiteral>(v => typeof v === 'string')
// .union([
//   themeColor,
//   customColor,
// ])
// .transform(value => value as ThemeColor)
// .meta({ id: 'ColorName' })

const colorValue = z
  .string()
  .min(1, 'Color value cannot be empty')
  // .transform(value => value as ColorLiteral)
  .meta({
    id: 'ColorLiteral',
    // description: 'Color value in any valid CSS format: hex, rgb, rgba, hsl, hsla ...',
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
      .default('rgba(0, 0, 0, 0.5)')
      .meta({ description: 'Label background color' }),
  })
  .meta({ id: 'RelationshipColorValues' })
  .transform(value => value as RelationshipColorValues)

const StrictThemeColorValuesSchema = z.strictObject({
  elements: ElementColorValuesSchema
    .or(
      colorSchema.transform(v => computeColorValues(v as ColorLiteral).elements),
    )
    .meta({
      description: 'Exact color value (hex, rgb, rgba, hsl, hsla ...) or break down of specific color values',
    }),
  relationships: RelationshipColorValuesSchema
    .or(
      colorSchema.transform(v => computeColorValues(v as ColorLiteral).relationships),
    )
    .meta({ description: 'Exact color value (hex, rgb, rgba, hsl, hsla ...) or break down of specific color values' }),
})
  .transform(value => value as ThemeColorValues)
  .meta({
    id: 'StrictThemeColorValues',
    description: 'Exact color value (hex, rgb, rgba, hsl, hsla ...) or break down of specific color value',
  })

export const ThemeColorValuesSchema = StrictThemeColorValuesSchema.or(
  colorSchema.transform(v => computeColorValues(v as ColorLiteral)),
)
  .transform(value => value as ThemeColorValues)
  .meta({
    id: 'ThemeColorValues',
    description: 'Exact value (hex, rgb, rgba, hsl, hsla ...) or break down of specific color values',
  })

export type ThemeColorValuesInput = z.input<typeof ThemeColorValuesSchema>

const ThemeColorsSchema = z.partialRecord(
  color,
  ThemeColorValuesSchema,
)
  .transform(value => value as Record<ThemeColor, ThemeColorValues>)

const DimensionsSchema = z.strictObject({
  width: z.number().min(50),
  height: z.number().min(50),
}).meta({
  id: 'Dimensions',
  description: 'Defines dimensions for theme size',
})

const LikeC4Config_Styles_Theme_Sizes = z.partialRecord(size, DimensionsSchema)

export const LikeC4Config_Styles_Theme = z
  .strictObject({
    colors: ThemeColorsSchema.optional().meta({
      description: 'Override theme colors',
    }),
    sizes: LikeC4Config_Styles_Theme_Sizes.optional().meta({
      description: 'Override theme sizes',
    }),
  })
  .meta({
    id: 'ThemeCustomization',
    description: 'Customize theme colors and sizes',
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
    iconPosition: iconPosition.optional().meta({ description: 'Default icon position for elements' }),
    group: LikeC4Config_Styles_Defaults_Group.optional().meta({
      description:
        'Override default values for group style properties\nThese values will be used if such property is not defined',
    }),
    relationship: LikeC4Config_Styles_Defaults_Relationship.optional().meta({
      description:
        'Override default values for relationship style properties\nThese values will be used if such property is not defined',
    }),
  })
  .meta({
    id: 'DefaultStyleValues',
  })

const LikeC4Config_Styles_CustomStylesheets = z
  .union([
    z.string().min(1, 'Custom CSS file path cannot be empty'),
    z.array(
      z.string().min(1, 'Custom CSS file path cannot be empty'),
    ),
  ])
  .meta({
    id: 'CustomStylesheets',
  })

export const LikeC4StylesConfigSchema = z
  .strictObject({
    theme: LikeC4Config_Styles_Theme.optional().meta({
      description: 'Project theme customization',
    }),
    defaults: LikeC4Config_Styles_Defaults.optional().meta({
      description:
        'Override default values for style properties\nThese values will be used if such property is not defined',
    }),
    customCss: LikeC4Config_Styles_CustomStylesheets.optional().meta({
      description: 'Custom CSS (or list of CSS files) to be included in the generated diagrams',
    }),
  })
  .transform(({ theme, defaults, customCss }): LikeC4ProjectStylesConfig =>
    exact({
      defaults: normalizeDefaults(defaults),
      customCss: normalizeStylesheets(customCss),
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
    relationship: relationship && exact(relationship) satisfies LikeC4ProjectStyleDefaults['relationship'],
    group: group && exact(group) satisfies LikeC4ProjectStyleDefaults['group'],
  }) satisfies LikeC4ProjectStyleDefaults
}

function normalizeStylesheets(
  stylesheets?: z.infer<typeof LikeC4Config_Styles_CustomStylesheets>,
): LikeC4ProjectStylesCustomStylesheets | undefined {
  if (!stylesheets) {
    return undefined
  }
  const paths = (Array.isArray(stylesheets) ? stylesheets : [stylesheets]).filter(Boolean)
  if (paths.length === 0) {
    return undefined
  }

  return {
    paths,
    content: '',
  }
}
