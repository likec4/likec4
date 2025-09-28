import type {
  LikeC4StylesConfig,
  ThemeColorValues,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { mix, scale, toHex, toRgba } from 'khroma'
import { memo } from 'react'
import { entries, join, map, pipe, range } from 'remeda'
import { useLikeC4Styles } from './hooks/useLikeC4Styles'

const scheme = (scheme: 'dark' | 'light') => `[data-mantine-color-scheme="${scheme}"]`

const whenDark = scheme('dark')
const whenLight = scheme('light')

const MAX_DEPTH = 5
const generateCompoundColors = (rootSelector: string, name: string, colors: ThemeColorValues, depth: number) => {
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
  const selector = `:where(${rootSelector} [data-likec4-color="${name}"][data-compound-depth="${depth}"])`

  return `
${selector} {
  --likec4-palette-fill: ${compoundLightColor(colors.elements.fill)};
  --likec4-palette-stroke: ${compoundLightColor(colors.elements.stroke)};
}
${whenDark} ${selector} {
  --likec4-palette-fill: ${compoundDarkColor(colors.elements.fill)};
  --likec4-palette-stroke: ${compoundDarkColor(colors.elements.stroke)};
}
  `.trim()
}

function toStyle(rootSelector: string, name: string, colors: ThemeColorValues): string {
  const { elements, relationships } = colors
  const selector = `:where(${rootSelector} [data-likec4-color=${name}])`
  return [
    `
${selector} {
  --likec4-palette-fill: ${elements.fill};
  --likec4-palette-stroke: ${elements.stroke};
  --likec4-palette-hiContrast: ${elements.hiContrast};
  --likec4-palette-loContrast: ${elements.loContrast};
  --likec4-palette-relation-stroke: ${relationships.line};
  --likec4-palette-relation-label: ${relationships.label};
  --likec4-palette-relation-label-bg: ${relationships.labelBg};
}
${whenLight} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(relationships.line, 'black', 85))};
}
${whenDark} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(relationships.line, 'white', 70))};
}

  `.trim(),
    ...range(1, MAX_DEPTH + 1).map((depth) => generateCompoundColors(rootSelector, name, colors, depth)),
  ].join('\n')
}

function generateBuiltInColorStyles(rootSelector: string, theme: LikeC4StylesConfig['theme']) {
  return pipe(
    theme.colors,
    entries(),
    map(([color, values]) => toStyle(rootSelector, color, values)),
    join('\n'),
  )
}

export const LikeC4Styles = memo<{ id: string }>(({ id }) => {
  const rootSelector = `#${id}`
  const nonce = useMantineStyleNonce()?.()
  const { theme } = useLikeC4Styles()

  // const colorsStyles = useMemo(() => generateBuiltInColorStyles(rootSelector, theme), [rootSelector, theme])
  const colorsStyles = generateBuiltInColorStyles(rootSelector, theme)

  return (
    <style
      type="text/css"
      data-likec4-colors={id}
      dangerouslySetInnerHTML={{ __html: colorsStyles }}
      nonce={nonce} />
  )

  // return (
  //   <MemoizedStyles
  //     id={id}
  //     nonce={nonce}
  //     colorsStyles={colorsStyles} />
  // )
})

/**
 * @internal Memoized styles gives a performance boost during development
 */
// const MemoizedStyles = memo<{
//   id: string
//   nonce: string | undefined
//   colorsStyles: string
// }>((
//   { id, nonce, colorsStyles },
// ) => (
//   <style
//     type="text/css"
//     data-likec4-colors={id}
//     dangerouslySetInnerHTML={{ __html: colorsStyles }}
//     nonce={nonce} />
// ))
