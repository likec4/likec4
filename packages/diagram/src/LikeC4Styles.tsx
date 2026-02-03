import type {
  ElementColorValues,
  LikeC4Styles as LikeC4StylesLib,
  ThemeColorValues,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { memo, useMemo } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { entries, join, map, pipe } from 'remeda'
import { MAX_COMPOUND_DEPTH } from './base/const'
import { useLikeC4Styles } from './hooks/useLikeC4Styles'

const scheme = (scheme: 'dark' | 'light') => `[data-mantine-color-scheme="${scheme}"]`

const whenDark = scheme('dark')

const generateCompoundColors = (rootSelector: string, name: string, colors: ElementColorValues, depth: number) => {
  const selector = `${rootSelector} :is([data-likec4-color="${name}"][data-compound-depth="${depth}"])`
  return `
${selector} {
  --likec4-palette-fill: ${colors.fill};
  --likec4-palette-stroke: ${colors.stroke};  
}
  `
}

function toStyle(
  styles: LikeC4StylesLib,
  params: {
    rootSelector: string
    name: string
    colors: ThemeColorValues
  },
): string {
  const { rootSelector, name, colors } = params
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
  --likec4-palette-relation-stroke-selected: oklch(from ${relationships.line} calc(l - 0.15) c h);
}
${whenDark} ${selector} {
  --likec4-palette-relation-stroke-selected: oklch(from ${relationships.line} calc(l + 0.15) c h);
}

  `,
    ...styles.colorsForCompounds(elements, MAX_COMPOUND_DEPTH).map((colors, depth) =>
      generateCompoundColors(rootSelector, name, colors, depth + 1)
    ),
  ].map(s => s.trim()).join('\n')
}

function generateBuiltInColorStyles(styles: LikeC4StylesLib, rootSelector: string) {
  return pipe(
    styles.theme.colors,
    entries(),
    map(([name, colors]) =>
      toStyle(styles, {
        rootSelector,
        name,
        colors,
      })
    ),
    join('\n'),
  )
}

export function LikeC4Styles({ id }: { id: string }): JSX.Element {
  const rootSelector = `#${id}`
  const nonce = useMantineStyleNonce()?.()
  const $styles = useLikeC4Styles()

  const colorsStyles = useMemo(() => generateBuiltInColorStyles($styles, rootSelector), [rootSelector, $styles])

  return (
    <MemoizedStyle
      id={id}
      nonce={nonce}
      colorsStyles={colorsStyles} />
  )
}

/**
 * @internal Memoized styles gives a performance boost during development
 */
const MemoizedStyle = memo<{
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
MemoizedStyle.displayName = 'MemoizedStyle'
