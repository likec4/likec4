import {
  type CustomColorDefinitions,
  type LikeC4ProjectStylesConfig,
  type ThemeColorValues,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { mix, scale, toHex, toRgba } from 'khroma'
import { memo, useMemo } from 'react'
import { entries, join, map, pipe, range } from 'remeda'
import { useLikeC4ProjectStyles, useLikeC4Specification } from './likec4model'

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
  const line = relationships.line ?? relationships.lineColor
  return [
    `
${selector} {
  --likec4-palette-fill: ${elements.fill};
  --likec4-palette-stroke: ${elements.stroke};
  --likec4-palette-hiContrast: ${elements.hiContrast};
  --likec4-palette-loContrast: ${elements.loContrast};
  --likec4-palette-relation-stroke: ${line};
  --likec4-palette-relation-label: ${relationships.label ?? relationships.labelColor};
  --likec4-palette-relation-label-bg: ${relationships.labelBg ?? relationships.labelBgColor};
}
${whenLight} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(line, 'black', 85))};
}
${whenDark} ${selector} {
  --likec4-palette-relation-stroke-selected: ${toRgba(mix(line, 'white', 70))};
}

  `.trim(),
    ...range(1, MAX_DEPTH + 1).map((depth) => generateCompoundColors(rootSelector, name, colors, depth)),
  ].join('\n')
}

function generateCustomColorStyles(customColors: CustomColorDefinitions, rootSelector: string) {
  return pipe(
    entries(customColors),
    map(([name, color]) => toStyle(rootSelector, name, color)),
    join('\n'),
  )
}

function generateBuiltInColorStyles(rootSelector: string, theme: LikeC4ProjectStylesConfig['theme']) {
  return pipe(
    theme.colors,
    entries(),
    map(([color, values]) => toStyle(rootSelector, color, values)),
    join('\n'),
  )
}

export function LikeC4Styles({ id }: { id: string }) {
  const rootSelector = `#${id}`
  const nonce = useMantineStyleNonce()?.()
  const projectStyles = useLikeC4ProjectStyles()
  const { customColors } = useLikeC4Specification()

  const {
    customColorsStyles,
    builtInColors,
  } = useMemo(() => ({
    customColorsStyles: customColors ? generateCustomColorStyles(customColors, rootSelector) : '',
    builtInColors: generateBuiltInColorStyles(rootSelector, projectStyles.theme),
  }), [customColors, rootSelector, projectStyles.theme])

  return (
    <MemoizedStyles
      id={id}
      nonce={nonce}
      customColorsStyles={customColorsStyles}
      builtInColors={builtInColors} />
  )
}

/**
 * @internal This gives a performance boost during development
 */
const MemoizedStyles = memo<{
  id: string
  nonce: string | undefined
  customColorsStyles: string
  builtInColors: string
}>((
  { id, nonce, customColorsStyles, builtInColors },
) => (
  <>
    <style
      type="text/css"
      data-likec4-colors={id}
      dangerouslySetInnerHTML={{ __html: builtInColors }}
      nonce={nonce} />
    {customColorsStyles && (
      <style
        type="text/css"
        data-likec4-custom-colors={id}
        dangerouslySetInnerHTML={{ __html: customColorsStyles }}
        nonce={nonce} />
    )}
  </>
))
