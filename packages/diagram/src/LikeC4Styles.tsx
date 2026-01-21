import type {
  LikeC4StylesConfig,
  ThemeColorValues,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { memo } from 'react'
import { entries, join, map, pipe, range } from 'remeda'
import { useLikeC4Styles } from './hooks/useLikeC4Styles'

const scheme = (scheme: 'dark' | 'light') => `[data-mantine-color-scheme="${scheme}"]`

const whenDark = scheme('dark')

const round = (num: number) => Math.round(num * 1000) / 1000

const MAX_DEPTH = 6
const generateCompoundColors = (rootSelector: string, name: string, colors: ThemeColorValues, depth: number) => {
  const selector = `${rootSelector} :is([data-likec4-color="${name}"][data-compound-depth="${depth}"])`

  const light = {
    c: round(1 - depth * 0.06),
    l: round(1.1 + (depth - 1) * 0.04),
  }

  const dark = {
    c: round(1 - depth * 0.085),
    l: round(0.8 - (depth - 1) * 0.05),
  }

  return `
${selector} {
  --likec4-palette-fill: oklch(from ${colors.elements.fill} calc(l * ${light.l}) calc(c * ${light.c}) h);
  --likec4-palette-stroke: oklch(from ${colors.elements.stroke} calc(l * ${light.l}) calc(c * ${light.c}) h);
}
 
${whenDark} ${selector} {
  --likec4-palette-fill: oklch(from ${colors.elements.fill} calc(l * ${dark.l}) calc(c * ${dark.c}) h);
  --likec4-palette-stroke: oklch(from ${colors.elements.stroke} calc(l * ${dark.l}) calc(c * ${dark.c}) h);
}
  `.trim()
}

function toStyle(
  rootSelector: string,
  name: string,
  colors: ThemeColorValues,
  maxDepth: number,
): string {
  const { elements, relationships } = colors
  const selector = `${rootSelector} :is([data-likec4-color=${name}])`
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
  --likec4-palette-relation-stroke-selected: oklch(from ${relationships.line} calc(l * 0.85) c h);
}
${whenDark} ${selector} {
  --likec4-palette-relation-stroke-selected: oklch(from ${relationships.line} calc(l * 1.2) calc(c * 1.05) h);
}

  `.trim(),
    ...range(1, maxDepth + 1).map((depth) => generateCompoundColors(rootSelector, name, colors, depth)),
  ].join('\n')
}

function generateBuiltInColorStyles(rootSelector: string, theme: LikeC4StylesConfig['theme'], maxDepth: number) {
  return pipe(
    theme.colors,
    entries(),
    map(([color, values]) => toStyle(rootSelector, color, values, maxDepth)),
    join('\n'),
  )
}

export function LikeC4Styles({ id, maxDepth = MAX_DEPTH }: { id: string; maxDepth?: number }) {
  const rootSelector = `#${id}`
  const nonce = useMantineStyleNonce()?.()
  const { theme } = useLikeC4Styles()

  // const colorsStyles = useMemo(() => generateBuiltInColorStyles(rootSelector, theme), [rootSelector, theme])
  const colorsStyles = generateBuiltInColorStyles(rootSelector, theme, maxDepth)

  return (
    <MemoizedStyles
      id={id}
      nonce={nonce}
      colorsStyles={colorsStyles} />
  )
}

/**
 * @internal Memoized styles gives a performance boost during development
 */
const MemoizedStyles = memo<{
  id: string
  nonce: string | undefined
  colorsStyles: string
}>((
  { id, nonce, colorsStyles },
) => (
  <style
    type="text/css"
    data-likec4-colors={id}
    dangerouslySetInnerHTML={{ __html: colorsStyles }}
    nonce={nonce} />
))
