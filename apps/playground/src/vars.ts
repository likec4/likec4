export const vars = {
  font: 'fonts.likec4',
  element: {
    font: 'fonts.likec4.element',
    fill: 'colors.likec4.element.fill',
    stroke: 'colors.likec4.element.stroke',
    hiContrast: 'colors.likec4.element.hiContrast',
    loContrast: 'colors.likec4.element.loContrast',
  },
  compound: {
    font: 'fonts.likec4.compound',
    titleColor: 'colors.likec4.compound.title',
  },
  safariAnimationHook: '--likec4-safari-animation-hook',
  background: {
    color: 'colors.likec4.background',
    pattern: {
      color: 'colors.likec4.background.pattern',
    },
  },
  relation: {
    line: 'colors.likec4.relation.line',
    lineColor: 'colors.likec4.relation.line',
    label: {
      color: 'colors.likec4.relation.label',
      bg: 'colors.likec4.relation.label.bg',
    },
    labelColor: 'colors.likec4.relation.label',
    labelBgColor: 'colors.likec4.relation.label.bg',
  },
} as const

// type MantineColor =
//   | 'dark'
//   | 'gray'
//   | 'red'
//   | 'pink'
//   // | 'grape'
//   // | 'violet'
//   // | 'indigo'
//   // | 'blue'
//   // | 'cyan'
//   | 'green'
//   // | 'lime'
//   | 'yellow'
//   // | 'orange'
//   | 'teal'
// function mapToTokens(mantineColor: MantineColor) {
//   const defaulttoken = `colors.mantine.${mantineColor}`)
//   return {
//     0: token.var(`colors.mantine.${mantineColor}[0]`,
//     1: token.var(`colors.mantine.${mantineColor}[1]`,
//     2: token.var(`colors.mantine.${mantineColor}[2]`,
//     3: token.var(`colors.mantine.${mantineColor}[3]`,
//     4: token.var(`colors.mantine.${mantineColor}[4]`,
//     5: token.var(`colors.mantine.${mantineColor}[5]`,
//     6: token.var(`colors.mantine.${mantineColor}[6]`,
//     7: token.var(`colors.mantine.${mantineColor}[7]`,
//     8: token.var(`colors.mantine.${mantineColor}[8]`,
//     9: token.var(`colors.mantine.${mantineColor}[9]`,
//     filled: token.var(`colors.mantine.${mantineColor}.filled`,
//     filledHover: token.var(`colors.mantine.${mantineColor}.filledHover`,
//     light: token(`colors.mantine.${mantineColor}.light`,
//     lightHover: token.var(`colors.mantine.${mantineColor}.lightHover`,
//     lightColor: token.var(`colors.mantine.${mantineColor}.lightColor`,
//     outline: token.var(`colors.mantine.${mantineColor}.outline`,
//     outlineHover: token.var(`colors.mantine.${mantineColor}.outlineHover`,
//   }
// }

export const mantine = {
  spacing: {
    '2xs': 'spacing.2xs',
    xs: 'spacing.xs',
    sm: 'spacing.sm',
    md: 'spacing.md',
    lg: 'spacing.lg',
    xl: 'spacing.xl',
  },
  fontSizes: {
    '2xs': 'fontSizes.2xs',
    xs: 'fontSizes.xs',
    sm: 'fontSizes.sm',
    md: 'fontSizes.md',
    lg: 'fontSizes.lg',
    xl: 'fontSizes.xl',
  },
  colors: {
    dimmed: 'colors.mantine.dimmed',
    body: 'token(colors.mantine.body)',
    default: 'colors.mantine.default',
    text: 'colors.mantine.text',
    placeholder: 'colors.mantine.placeholder',
    defaultBorder: 'colors.mantine.defaultBorder',
    defaultHover: 'colors.mantine.defaultHover',
    // dark: mapToTokens('dark'),
    // gray: mapToTokens('gray'),
    // red: mapToTokens('red'),
    // green: mapToTokens('green'),
    // teal: mapToTokens('teal'),
  },
}

export const xyvars = {
  background: {
    color: '--xy-background-color',
    pattern: {
      color: '--xy-background-pattern-color',
      // dots: 'background-pattern-dots-color',
      // lines: 'background-pattern-lines-color',
      // cross: 'background-pattern-cross-color'
    },
  },
  edge: {
    stroke: '--xy-edge-stroke',
    strokeSelected: '--xy-edge-stroke-selected',
    labelColor: '--xy-edge-label-color',
    labelBgColor: '--xy-edge-label-background-color',
    strokeWidth: '--xy-edge-stroke-width',
  },
  node: {
    color: '--xy-node-color',
    border: '--xy-node-border',
    backgroundColor: '--xy-node-background-color',
    groupBackgroundColor: '--xy-node-group-background-color',
    boxshadowHover: '--xy-node-boxshadow-hover',
    boxshadowSelected: '--xy-node-boxshadow-selected',
    borderRadius: '--xy-node-border-radius',
  },
} as const
