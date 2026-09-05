import type { SemanticToken, TokenDataTypes } from '@pandacss/types'
import { defaultMantineColors } from '../generated'

export const { gray, dark, orange, green, yellow } = defaultMantineColors

export const white = '#ffffff'
export const black = '#000000'

export function value(base: string): SemanticToken<TokenDataTypes['colors'], 'base' | '_dark'>
export function value(base: string, dark: string): SemanticToken<TokenDataTypes['colors'], 'base' | '_dark'>
export function value(
  value: { description?: string; value: string; dark?: string },
): SemanticToken<TokenDataTypes['colors'], 'base' | '_dark'>
export function value(
  arg1: string | { description?: string; value: string; dark?: string },
  arg2?: string,
) {
  const { value, dark, ...rest } = typeof arg1 === 'string' ? { value: arg1, dark: arg2 } : arg1
  return ({
    ...rest,
    value: dark ?
      {
        base: value,
        _dark: dark,
      } :
      value,
  })
}
