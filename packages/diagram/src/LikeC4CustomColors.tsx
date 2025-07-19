import {
  type CustomColorDefinitions,
  type ElementThemeColorValues,
  type RelationshipThemeColorValues,
  type ThemeColorValues,
  nonexhaustive,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { memo, useState } from 'react'
import { entries, isEmpty } from 'remeda'
import { useUpdateEffect } from './hooks'
import { useLikeC4Specification } from './likec4model/useLikeC4Model'

interface LikeC4CustomColorsProperties {
  customColors: CustomColorDefinitions
}
function keyToCssVar(key: keyof RelationshipThemeColorValues | keyof ElementThemeColorValues): string {
  switch (key) {
    case 'lineColor':
      return 'line'
    case 'labelBgColor':
      return 'label-bg'
    case 'labelColor':
      return 'label'
    case 'fill':
      return 'fill'
    case 'stroke':
      return 'stroke'
    case 'hiContrast':
      return 'hi-contrast'
    case 'loContrast':
      return 'lo-contrast'
    case 'light':
      return 'light'
    case 'dark':
      return 'dark'
    default:
      nonexhaustive(key)
  }
}

function toStyle(name: String, colors: ThemeColorValues): String {
  const darken = (color: string) => `color-mix(in srgb, ${color} 80%, black)`
  return `
:where([data-likec4-color=${name}]) {
  --colors-likec4-palette-hi-contrast: ${colors.elements.hiContrast};
  --colors-likec4-palette-lo-contrast: ${colors.elements.loContrast};
  --colors-likec4-palette-fill: ${colors.elements.fill};
  --colors-likec4-palette-stroke: ${colors.elements.stroke};
  --colors-likec4-palette-light: ${colors.elements.light};
  --colors-likec4-palette-dark: ${colors.elements.dark};
  --colors-likec4-relation-stroke: ${colors.relationships.lineColor};
  --colors-likec4-relation-stroke-selected: color-mix(in srgb, ${colors.relationships.lineColor}, var(--colors-likec4-mix-color) 20%);
  --colors-likec4-relation-label: ${colors.relationships.labelColor};
  --colors-likec4-relation-label-bg: ${colors.relationships.labelBgColor};
}
:where(.likec4-compound-node[data-likec4-color=${name}]) {
  --colors-likec4-palette-fill: ${darken(colors.elements.fill)};
  --colors-likec4-palette-stroke: ${darken(colors.elements.stroke)};
  --colors-likec4-palette-light: ${colors.elements.light};
  --colors-likec4-palette-dark: ${colors.elements.dark};
}
  `
}

function generateCustomColorStyles(customColors: CustomColorDefinitions) {
  return entries(customColors)
    .map(([name, color]) => toStyle(name, color))
    .join('\n')
    .trim()
}

export const LikeC4CustomColors = memo(() => {
  const customColors = useLikeC4Specification().customColors ?? {}
  const [styles, setStyles] = useState(() => generateCustomColorStyles(customColors))

  useUpdateEffect(() => {
    setStyles(generateCustomColorStyles(customColors))
  }, [customColors])

  const nonce = useMantineStyleNonce()?.()

  if (isEmpty(customColors)) {
    return null
  }

  return (
    <>
      <style type="text/css" dangerouslySetInnerHTML={{ __html: styles }} nonce={nonce} />
    </>
  )
})
LikeC4CustomColors.displayName = 'LikeC4CustomColors'
