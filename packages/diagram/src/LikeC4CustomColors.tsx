import { type ThemeColorValues } from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { memo } from 'react'
import { entries } from 'remeda'
import type { LikeC4CustomColorsProperties } from './LikeC4CustomColors.props'
import { vars } from './theme-vars'

type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number} )`

export const LikeC4CustomColors = memo<LikeC4CustomColorsProperties>(({ customColors }) => {
  function toStyle(name: String, colorValues: ThemeColorValues): String {
    const rules = new Array<String>(
      ...entries(colorValues.elements).map(([key, value]) => `${stripCssVarReference(vars.element[key])}: ${value};`),
      ...entries(colorValues.relationships).map(([key, value]) =>
        `${stripCssVarReference(vars.relation[key])}: ${value};`
      )
    )
      .join('\n')

    return `:where([data-likec4-color=${name}]) {
            ${rules}
        }`
  }

  function stripCssVarReference(ref: CSSVarFunction): String {
    const end = ref.indexOf(',')
    return ref.substring(4, end == -1 ? ref.length - 1 : end)
  }

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
