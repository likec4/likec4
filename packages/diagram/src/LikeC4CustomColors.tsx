import {
  type CustomColorDefinitions,
  type RelationshipThemeColorValues,
  type ThemeColorValues,
  nonexhaustive,
} from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { memo } from 'react'
import { entries } from 'remeda'
// import { vars } from './theme-vars'

type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number} )`

interface LikeC4CustomColorsProperties {
  customColors: CustomColorDefinitions
}
function keyToCssVar(key: keyof RelationshipThemeColorValues): string {
  switch (key) {
    case 'lineColor':
      return 'line'
    case 'labelBgColor':
      return 'label-bg'
    case 'labelColor':
      return 'label'
    default:
      nonexhaustive(key)
  }
}

function toStyle(name: String, colorValues: ThemeColorValues): String {
  const rules = [
    ...entries(colorValues.elements)
      .map(([key, value]) => `--colors-likec4-element-${key}: ${value};`),
    ...entries(colorValues.relationships)
      .map(([key, value]) => `--colors-likec4-relation-${keyToCssVar(key)}: ${value};`),
  ]
    .join('\n')

  return `:where([data-likec4-color=${name}]) {
  ${rules}
}`
}

export const LikeC4CustomColors = memo<LikeC4CustomColorsProperties>(({ customColors }) => {
  const styles = entries(customColors)
    .map(([name, color]) => toStyle(name, color))
    .join('\n')

  const nonce = useMantineStyleNonce()?.()

  return (
    <>
      <style type="text/css" dangerouslySetInnerHTML={{ __html: styles }} nonce={nonce} />
    </>
  )
}, deepEqual)
LikeC4CustomColors.displayName = 'LikeC4CustomColors'
