import {
  type CustomColorDefinitions,
  type ThemeColorValues,
  defaultTheme,
  ThemeColors,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { mix, scale, toHex, toRgba } from 'khroma'
import { entries, join, map, pipe, range } from 'remeda'
import globalsCss from './globals.css?inline'
import { useLikeC4Specification } from './likec4model'

const scheme = (scheme: 'dark' | 'light') => `[data-mantine-color-scheme="${scheme}"]`

const whenDark = scheme('dark')
const whenLight = scheme('light')

const MAX_DEPTH = 5
const generateCompoundColors = (name: string, colors: ThemeColorValues, depth: number) => {
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
  const selector = `:where([data-likec4-color="${name}"][data-compound-depth="${depth}"])`

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

function toStyle(name: string, colors: ThemeColorValues): string {
  const selector = `:where([data-likec4-color=${name}])`
  return [
    `
${selector} {
  --likec4-palette-fill: ${colors.elements.fill};
  --likec4-palette-stroke: ${colors.elements.stroke};
  --likec4-palette-hiContrast: ${colors.elements.hiContrast};
  --likec4-palette-loContrast: ${colors.elements.loContrast};
  --likec4-palette-relation-stroke: ${colors.relationships.lineColor};
  --likec4-palette-relation-label: ${colors.relationships.labelColor};
  --likec4-palette-relation-label-bg: ${colors.relationships.labelBgColor};
}
${whenLight} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(colors.relationships.lineColor, 'black', 85))};
}
${whenDark} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(colors.relationships.lineColor, 'white', 70))};
}

  `.trim(),
    ...range(1, MAX_DEPTH + 1).map((depth) => generateCompoundColors(name, colors, depth)),
  ].join('\n')
}

const builtInColors = ThemeColors.map((color) =>
  toStyle(color, {
    elements: defaultTheme.elements[color],
    relationships: defaultTheme.relationships[color],
  })
).join('\n')

function generateCustomColorStyles(customColors: CustomColorDefinitions) {
  return pipe(
    entries(customColors),
    map(([name, color]) => toStyle(name, color)),
    join('\n'),
  )
}

export function LikeC4Styles() {
  const nonce = useMantineStyleNonce()?.()

  const customColors = useLikeC4Specification().customColors
  const customColorsStyles = customColors ? generateCustomColorStyles(customColors) : ''

  return (
    <>
      <style type="text/css" data-likec4-global dangerouslySetInnerHTML={{ __html: globalsCss }} nonce={nonce} />
      <style type="text/css" data-likec4-colors dangerouslySetInnerHTML={{ __html: builtInColors }} nonce={nonce} />
      {customColorsStyles && (
        <style
          type="text/css"
          data-likec4-custom-colors
          dangerouslySetInnerHTML={{ __html: customColorsStyles }}
          nonce={nonce} />
      )}
    </>
  )
}
