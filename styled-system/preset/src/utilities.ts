import { type Config, defineUtility } from '@pandacss/dev'
import { compoundColors, themeColors } from './generated'

type ExtendableConditions = NonNullable<Config['conditions']>

const colorPaletteValues = [
  ...themeColors,
  ...compoundColors,
]
type Likec4ColorPalette = typeof colorPaletteValues[number]

export const likec4Palette = defineUtility({
  values: colorPaletteValues,
  className: 'likec4-palette',
  // @ts-expect-error
  property: '--likec4-palette',
  transform(value: Likec4ColorPalette, { token }) {
    if (!colorPaletteValues.includes(value)) {
      throw new Error(`Invalid value "${value}" for likec4ColorPalette`)
    }
    const [color, depth] = value.split('.') as [string, string | undefined]
    // console.log('🚀 ~ transform ~ color:', color)
    // const name = `colors.likec4.${color}.element.fill`
    // console.log('🚀 ~ transform ~ fillColor:', token(name))
    // console.log('🚀 ~ transform ~ fillColor token:', token.raw(name)?.extensions?['var'])

    if (depth) {
      return {
        ['--likec4-palette']: `likec4.compound${depth}.${color}`,
        ['--colors-likec4-palette-hi-contrast']: token(`colors.likec4.compound${depth}.${color}.hiContrast`),
        ['--colors-likec4-palette-lo-contrast']: token(`colors.likec4.compound${depth}.${color}.loContrast`),
        ['--colors-likec4-palette-fill']: token(`colors.likec4.compound${depth}.${color}.fill`),
        ['--colors-likec4-palette-stroke']: token(`colors.likec4.compound${depth}.${color}.stroke`),
      }
    } else {
      return {
        ['--likec4-palette']: `likec4.${color}`,
        ['--colors-likec4-palette-fill']: token(`colors.likec4.${color}.element.fill`),
        ['--colors-likec4-palette-stroke']: token(`colors.likec4.${color}.element.stroke`),
        ['--colors-likec4-palette-hi-contrast']: token(`colors.likec4.${color}.element.hiContrast`),
        ['--colors-likec4-palette-lo-contrast']: token(`colors.likec4.${color}.element.loContrast`),
      }
    }
  },
})

export const likec4RelationPalette = defineUtility({
  values: themeColors,
  className: 'likec4-relation-color',
  transform(value, { token, raw }) {
    if (!themeColors.includes(value)) {
      console.log('raw', raw)
      throw new Error(`Invalid value "${value}" for likec4RelationPalette`)
    }
    return {
      ['--colors-likec4-relation-stroke']: token(`colors.likec4.${value}.relation.stroke`),
      ['--colors-likec4-relation-stroke-selected']: token(`colors.likec4.${value}.relation.stroke.selected`),
      ['--colors-likec4-relation-label']: token(`colors.likec4.${value}.relation.label`),
      ['--colors-likec4-relation-label-bg']: token(`colors.likec4.${value}.relation.label.bg`),
    }
  },
})
