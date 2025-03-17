import { defaultTheme, ElementShapes, ThemeColors } from '@likec4/core'
import { DEFAULT_THEME, rem } from '@mantine/core'
import { themeToVars } from '@mantine/vanilla-extract'
import type { Config, SystemStyleObject } from '@pandacss/dev'
import PresetPanda from '@pandacss/preset-panda'
import JSON5 from 'json5'
import { scale, toHex } from 'khroma'
import { writeFileSync } from 'node:fs'
import { capitalize, concat, entries, fromEntries, keys, map, mapKeys, mapToObj, mapValues, pipe } from 'remeda'
const mantineVars = themeToVars({})

const PandaTheme = PresetPanda.theme
const { colors: _, ...pandaTokens } = PandaTheme.tokens
// omitting stack her
type MantineColors = typeof mantineVars.colors
type ExtendableTheme = NonNullable<Config['theme']>

const mapcolorToVar = <C extends keyof MantineColors>(color: C) => ({
  [color]: {
    value: mantineVars.colors[color] as string,
  },
} as {
  [key in C]: { value: string }
})

const mapcolors = (color: keyof MantineColors, prefix = color) =>
  pipe(
    mantineVars.colors[color] as typeof mantineVars.colors.blue,
    entries(),
    map(([prop, value]) => {
      const key = prop.match(/^\d$/) ? `[${prop}]` : `.${prop}`
      return [`${prefix}${key}`, { value }] as [string, { value: string }]
    }),
    concat([[`${prefix}`, { value: mantineVars.colors[color]![6] }]] as [[string, { value: string }]]),
    fromEntries(),
  )

const generateLikeC4SemanticTokens = () => ({
  element: {
    fill: {
      description: 'Element fill color',
      value: {
        base: `${defaultTheme.elements.primary.fill}`,
        // ...mapToObj(ThemeColors, (color) => [
        //   '_likec4Color' + capitalize(color),
        //   defaultTheme.elements[color].fill,
        // ]),
      },
    },
    stroke: {
      description: 'Element stroke color',
      value: {
        base: `${defaultTheme.elements.primary.stroke}`,
        // ...mapToObj(ThemeColors, (color) => [
        //   '_likec4Color' + capitalize(color),
        //   defaultTheme.elements[color].stroke,
        // ]),
      },
    },
    hiContrast: {
      description: 'Element hiContrast text color (title)',
      value: {
        base: `${defaultTheme.elements.primary.hiContrast}`,
        // ...mapToObj(ThemeColors, (color) => [
        //   '_likec4Color' + capitalize(color),
        //   defaultTheme.elements[color].hiContrast,
        // ]),
      },
    },
    loContrast: {
      description: 'Element loContrast text color (description)',
      value: {
        base: `${defaultTheme.elements.primary.loContrast}`,
        // ...mapToObj(ThemeColors, (color) => [
        //   '_likec4Color' + capitalize(color),
        //   defaultTheme.elements[color].loContrast,
        // ]),
      },
    },
  },
  compound: {
    title: {
      description: 'Compound title color',
      value: {
        base: `{colors.likec4.element.loContrast}`,
      },
    },
  },
  relation: {
    line: {
      description: 'Relationship line color',
      value: {
        base: `${defaultTheme.relationships.gray.lineColor}`,
        // ...mapToObj(ThemeColors, (color) => [
        //   '_likec4Color' + capitalize(color),
        //   defaultTheme.relationships[color].lineColor,
        // ]),
      },
    },
    label: {
      DEFAULT: {
        description: 'Relationship label color',
        value: {
          base: `${defaultTheme.relationships.gray.labelColor}`,
          // ...mapToObj(ThemeColors, (color) => [
          //   '_likec4Color' + capitalize(color),
          //   defaultTheme.relationships[color].labelColor,
          // ]),
        },
      },
      bg: {
        description: 'Relationship label background color',
        value: {
          base: `${defaultTheme.relationships.gray.labelBgColor}`,
          // ...mapToObj(ThemeColors, (color) => [
          //   '_likec4Color' + capitalize(color),
          //   defaultTheme.relationships[color].labelBgColor,
          // ]),
        },
      },
    },
  },
})

const generateCompoundColors = () => {
  const compoundDarkColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -22 - 5 * depth,
        s: -10 - 6 * depth,
      }),
    )
  const compoundLightColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -20 - 3 * depth,
        s: -3 - 6 * depth,
      }),
    )

  const classes = new Map<string, SystemStyleObject>()
  for (const color of keys(defaultTheme.elements)) {
    classes.set(`:where([data-likec4-color='${color}'])`, {
      '--colors-likec4-element-fill': defaultTheme.elements[color].fill,
      '--colors-likec4-element-stroke': defaultTheme.elements[color].stroke,
      '--colors-likec4-element-hiContrast': defaultTheme.elements[color].hiContrast,
      '--colors-likec4-element-loContrast': defaultTheme.elements[color].loContrast,
      '--colors-likec4-relation-line': defaultTheme.relationships[color].lineColor,
      '--colors-likec4-relation-label': defaultTheme.relationships[color].labelColor,
      '--colors-likec4-relation-label-bg': defaultTheme.relationships[color].labelBgColor,
    })
    for (let depth = 1; depth <= 6; depth++) {
      classes.set(`:where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`, {
        '--colors-likec4-element-fill': compoundLightColor(defaultTheme.elements[color].fill, depth),
        '--colors-likec4-element-stroke': compoundLightColor(defaultTheme.elements[color].stroke, depth),
      })
      classes.set(
        `:where([data-mantine-color-scheme="dark"]) :where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
        {
          '--colors-likec4-element-fill': compoundDarkColor(defaultTheme.elements[color].fill, depth),
          '--colors-likec4-element-stroke': compoundDarkColor(defaultTheme.elements[color].stroke, depth),
        },
      )
    }
  }

  return fromEntries([...classes.entries()])
}

const likec4theme = {
  ...PandaTheme,
  breakpoints: {
    ...DEFAULT_THEME.breakpoints,
  },
  tokens: {
    ...pandaTokens as any,
    sizes: {},
    containerNames: {},
    spacing: {
      ...mapValues(DEFAULT_THEME.spacing, (value) => ({ value })),
      '0': {
        value: '0px',
      },
      '2': {
        value: '2px',
      },
      '4': {
        value: '4px',
      },
      'micro': {
        value: '4px',
      },
      '2xs': {
        value: '8px',
      },
      '8': {
        value: '8px',
      },
      likec4: {
        ...mapValues(defaultTheme.spacing, (value, key) => ({
          description: `LikeC4 style spacing: ${key}`,
          value: `${value}px`,
        })),
      },
    },
    // spacing: {
    //   mantine: {
    //     spacing: {
    //       ...mapValues(mantine.spacing, (value) => ({ value })),
    //     },
    //   },
    // },
    // sizes
    radii: {
      ...mapValues(mantineVars.radius, (value) => ({ value })),
    },
    fontSizes: {
      // ...pandaTokens.fontSizes,
      ...mapValues(DEFAULT_THEME.fontSizes, (value) => ({ value })),
      '2xs': {
        value: rem(10),
      },
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
    fonts: {
      ...pandaTokens.fonts,
      body: {
        value: 'var(--likec4-app-font, var(--likec4-app-font-default))',
      },
      likec4: {
        DEFAULT: {
          value: 'var(--likec4-app-font, var(--likec4-app-font-default))',
        },
        element: {
          value: 'var(--likec4-element-font, {fonts.likec4})',
        },
        compound: {
          value: 'var(--likec4-compound-font, {fonts.likec4})',
        },
        relation: {
          value: 'var(--likec4-relation-font, {fonts.likec4})',
        },
      },
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
          ...mapcolorToVar('primary'),
          ...mapcolors('gray'),
          ...mapcolors('dark'),
          ...mapcolors('orange'),
          ...mapcolors('teal'),
          ...mapcolors('red'),
          ...mapcolors('green'),
          ...mapcolors('yellow'),
          // ...mapcolors('green'),
          // ...mapcolors('red'),
          // ...mapcolors('teal'),
          // ...mapcolors('pink'),
          // ...mapcolors('yellow'),
        },
      },
      likec4: {
        mixStrokeFill: {
          description: 'Mix of stroke and fill colors, used for "darker" areas',
          value: 'color-mix(in srgb, {colors.likec4.element.stroke} 90%, {colors.likec4.element.fill})',
        },
      },
    },
    easings: {
      ...pandaTokens.easings,
      out: {
        value: 'cubic-bezier(0, 0, 0.40, 1)',
      },
      inOut: {
        value: 'cubic-bezier(0.50, 0, 0.2, 1)',
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
            value: {
              base: '{colors.mantine.colors.body}',
            },
          },
          pattern: {
            description: 'Background pattern color',
            value: {
              base: '{colors.mantine.colors.gray[4]}',
              _dark: '{colors.mantine.colors.dark[5]}',
            },
          },
        },
        // primary: generateLikeC4SemanticTokens('blue'),
        // secondary: generateLikeC4SemanticTokens('indigo'),
        // muted: generateLikeC4SemanticTokens('slate'),
        // ...generateLikeC4SemanticTokens('primary'),
        ...generateLikeC4SemanticTokens(),
      },
    },
  },
} satisfies ExtendableTheme

// const staticCssIncludeColors = flatMap(LikeC4Colors, (color) => [
//   `likec4.${color}.element.fill`,
//   `likec4.${color}.element.stroke`,
//   `likec4.${color}.element.hiContrast`,
//   `likec4.${color}.element.loContrast`,
//   `likec4.${color}.compound.title`,
//   `likec4.${color}.relation.line`,
//   `likec4.${color}.relation.label`,
//   `likec4.${color}.relation.label.bg`,
// ])
// staticCssIncludeColors.push(...[
//   'mantine.white',
//   'mantine.text',
//   'mantine.body',
//   'mantine.dimmed',
//   'mantine.defaultBorder',
//   'mantine.defaultColor',
//   'mantine.defaultHover',
//   'mantine.default',
//   'mantine.error',
//   'mantine.placeholder',
// ])

const ts = `// This file is auto-generated by scripts/generate.ts

export const staticCssIncludeProps = ${
  JSON5.stringify(
    {
      fill: [
        'likec4.element.fill',
      ],
      stroke: [
        'likec4.element.stroke',
        'likec4.relation.line',
      ],
      color: [
        'likec4.element.hiContrast',
        'likec4.element.loContrast',
        'likec4.compound.title',
        'likec4.relation.label',
        'mantine.colors.text',
        'mantine.colors.dimmed',
        'mantine.colors.defaultColor',
        'mantine.colors.default',
        'mantine.colors.placeholder',
      ],
      background: [
        'likec4.background',
        'mantine.colors.body',
        'mantine.colors.defaultHover',
        'likec4.relation.label.bg',
      ],
    },
    null,
    2,
  )
}

export const conditions = ${
  JSON5.stringify(
    {
      ...mapToObj(ThemeColors, (color) => [
        'likec4Color' + capitalize(color),
        `:where([data-likec4-color='${color}']) &`,
      ]),
      ...pipe(
        defaultTheme.sizes,
        mapValues((value, key) => `:where([data-likec4-shape-size='${key}']) &`),
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
      ...mapToObj(entries(defaultTheme.textSizes), ([size, value]) => [
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
      ...generateCompoundColors(),
    },
    null,
    2,
  )
}

export const theme = ${JSON5.stringify(likec4theme, null, 2)}
`

writeFileSync('./src/generated.ts', ts)
console.log('theme generated')
