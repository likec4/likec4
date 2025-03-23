import { type ThemeColor, defaultTheme, ElementShapes, ThemeColors } from '@likec4/core/src'
import { DEFAULT_THEME } from '@mantine/core'
import { themeToVars } from '@mantine/vanilla-extract'
import type { Config } from '@pandacss/dev'
import JSON5 from 'json5'
import { mix, scale, toHex } from 'khroma'
import { writeFileSync } from 'node:fs'
import {
  capitalize,
  entries,
  flatMap,
  fromKeys,
  join,
  keys,
  map,
  mapKeys,
  mapToObj,
  mapValues,
  pipe,
  range,
  times,
} from 'remeda'
const mantineVars = themeToVars({})

// omitting stack her
type MantineColors = typeof mantineVars.colors
type MantineColorValues = typeof mantineVars.colors.primaryColors
type ExtendableTheme = NonNullable<Config['theme']>

const mapcolorToVar = <C extends keyof MantineColors>(color: C) => ({
  [color]: {
    value: mantineVars.colors[color] as string,
  },
} as {
  [key in C]: { value: string }
})

const mapcolors = (colorkey: keyof MantineColors, prefix = colorkey) => {
  const color = mantineVars.colors[colorkey] as MantineColorValues
  return ({
    [prefix]: {
      DEFAULT: { value: color[6] },
      filled: { value: color.filled },
      filledHover: { value: color.filledHover },
      light: { value: color.light },
      lightHover: { value: color.lightHover },
      lightColor: { value: color.lightColor },
      outline: { value: color.outline },
      outlineHover: { value: color.outlineHover },
    },
    ...mapToObj(range(0, 10), idx => [
      `${prefix}[${idx}]`,
      // @ts-ignore
      { value: color[idx] },
    ]),
  })
}

function rem(pixels: number) {
  return `${(pixels / 16).toPrecision(3)}rem`
}

const MAX_DEPTH = 5
const generateCompoundColors = (color: ThemeColor, depth: number) => {
  const compoundDarkColor = (color: string) =>
    toHex(
      scale(color, {
        l: -22 - 5 * depth,
        s: -10 - 6 * depth,
      }),
    )
  const compoundLightColor = (color: string) =>
    toHex(
      scale(color, {
        l: -20 - 3 * depth,
        s: -3 - 6 * depth,
      }),
    )
  return {
    hiContrast: { value: `{colors.likec4.${color}.element.hiContrast}` },
    loContrast: { value: `{colors.likec4.${color}.element.loContrast}` },
    fill: {
      value: {
        base: compoundLightColor(defaultTheme.elements[color].fill),
        _dark: compoundDarkColor(defaultTheme.elements[color].fill),
      },
    },
    stroke: {
      value: {
        base: compoundLightColor(defaultTheme.elements[color].stroke),
        _dark: compoundDarkColor(defaultTheme.elements[color].stroke),
      },
    },
  }
}

const generateRelationColors = (color: ThemeColor) => ({
  relation: {
    stroke: {
      DEFAULT: { value: defaultTheme.relationships[color].lineColor },
      selected: {
        value: {
          base: toHex(mix(defaultTheme.relationships[color].lineColor, 'black', 85)),
          _dark: toHex(mix(defaultTheme.relationships[color].lineColor, 'white', 70)),
        },
      },
    },
    label: {
      DEFAULT: { value: defaultTheme.relationships[color].labelColor },
      bg: { value: defaultTheme.relationships[color].labelBgColor },
    },
  },
})

const generateLikeC4ElementColor = (color: ThemeColor) => {
  return {
    element: {
      fill: { value: defaultTheme.elements[color].fill },
      stroke: { value: defaultTheme.elements[color].stroke },
      hiContrast: { value: defaultTheme.elements[color].hiContrast },
      loContrast: { value: defaultTheme.elements[color].loContrast },
    },
  }
}

const likec4theme = {
  breakpoints: {
    ...DEFAULT_THEME.breakpoints,
  },
  tokens: {
    spacing: {
      ...mapValues(DEFAULT_THEME.spacing, (value) => ({ value })),
      likec4: {
        ...mapValues(defaultTheme.spacing, (value, key) => ({
          description: `LikeC4 style spacing: ${key}`,
          value: `${value}px`,
        })),
      },
    },
    radii: {
      ...mapValues(mantineVars.radius, (value) => ({ value })),
    },
    fontSizes: {
      'xxs': {
        value: rem(10),
      },
      ...mapValues(DEFAULT_THEME.fontSizes, (value) => ({ value })),
      likec4: {
        ...mapValues(defaultTheme.textSizes, (value, key) => ({
          description: `LikeC4 style text size: ${key}`,
          value: rem(value),
        })),
      },
    },
    lineHeights: {
      ...mapValues(DEFAULT_THEME.lineHeights, (value) => ({ value })),
    },
    colors: {
      mantine: {
        colors: {
          ...mapcolors('primaryColors', 'primary'),
          ...mapcolorToVar('white'),
          ...mapcolorToVar('text'),
          ...mapcolorToVar('body'),
          ...mapcolorToVar('dimmed'),
          ...mapcolorToVar('defaultBorder'),
          ...mapcolorToVar('defaultColor'),
          ...mapcolorToVar('defaultHover'),
          ...mapcolorToVar('default'),
          ...mapcolorToVar('error'),
          ...mapcolorToVar('placeholder'),
          ...mapcolors('gray'),
          ...mapcolors('dark'),
          ...mapcolors('orange'),
          ...mapcolors('teal'),
          ...mapcolors('red'),
          ...mapcolors('green'),
          ...mapcolors('yellow'),
        },
      },
    },
    shadows: {
      ...mapValues(DEFAULT_THEME.shadows, (value) => ({ value })),
    },
  },
  semanticTokens: {
    colors: {
      likec4: {
        background: {
          DEFAULT: {
            description: 'Background color',
            value: '{colors.mantine.colors.body}',
          },
          pattern: {
            description: 'Background pattern color',
            value: {
              base: '{colors.mantine.colors.dark[5]}',
              _light: '{colors.mantine.colors.gray[4]}',
            },
          },
        },
        ...fromKeys(ThemeColors, (color) => ({
          ...generateLikeC4ElementColor(color),
          ...generateRelationColors(color),
        })),
        ...mapToObj(range(1, MAX_DEPTH + 1), (depth) => [
          `compound${depth}`,
          fromKeys(ThemeColors, (color) => ({
            ...generateCompoundColors(color, depth),
          })),
        ]),
      },
    },
  },
} satisfies ExtendableTheme

const ts = `// This file is auto-generated by scripts/generate.ts

export const themeColors = [
${map(ThemeColors, (color) => `  '${color}' as const`).join(',\n')}
]

export const compoundColors = [
${
  pipe(
    ThemeColors,
    flatMap((color) => times(MAX_DEPTH, d => `${color}.${d + 1}`)),
    map((color) => `  '${color}' as const`),
    join(',\n'),
  )
}
]

export const conditions = ${
  JSON5.stringify(
    {
      // ...mapToObj(ThemeColors, (color) => [
      //   'likec4Color' + capitalize(color),
      //   `:where([data-likec4-color='${color}']) &`,
      // ]),
      ...pipe(
        defaultTheme.sizes,
        mapValues((_, key) => `:where([data-likec4-shape-size='${key}']) &`),
        mapKeys((key) => 'shapeSize' + capitalize(key)),
      ),
      ...mapToObj(ElementShapes, (shape) => [
        'shape' + capitalize(shape),
        `:where([data-likec4-shape='${shape}']) &`,
      ]),
    },
    null,
    2,
  )
}

export const globalCss = ${
  JSON5.stringify(
    {
      ...mapToObj(entries(defaultTheme.textSizes), ([size]) => [
        `:where([data-likec4-text-size='${size}'])`,
        {
          '--likec4-text-size': `{fontSizes.likec4.${size}}`,
        },
      ]),
      ...mapToObj(keys(defaultTheme.spacing), (size) => [
        `:where([data-likec4-spacing='${size}'])`,
        {
          '--likec4-spacing': `{spacing.likec4.${size}}`,
        },
      ]),
      // ...generateCompoundColors(),
    },
    null,
    2,
  )
}

export const theme = ${JSON5.stringify(likec4theme, null, 2)}
`

writeFileSync('./src/generated.ts', ts)
console.log('theme generated')
