import { definePattern } from '@pandacss/dev'
import type { LiteralUnion } from '@pandacss/types'
import type { ThemeColor } from '../defaults/types'
import { ThemeColors } from '../defaults/types'

export const txt = definePattern({
  properties: {
    inline: {
      description: 'Whether the text should be inline (default: false)',
      type: 'boolean',
    },
    medium: {
      description: 'Font weight medium (default: false)',
      type: 'boolean',
    },
    semibold: {
      description: 'Font weight semibold (default: false)',
      type: 'boolean',
    },
    dimmed: {
      description: 'Whether the text should be dimmed (default: false)',
      type: 'boolean',
    },
    nouserselect: {
      description: 'Whether the text should not be selectable (default: false)',
      type: 'boolean',
    },
    lh: {
      type: 'token',
      value: 'lineHeights',
    },
    size: {
      type: 'token',
      value: 'fontSizes',
    },
    fw: {
      type: 'token',
      value: 'fontWeights',
    },
    likec4color: {
      type: 'enum',
      value: [...ThemeColors] as Array<LiteralUnion<ThemeColor>>,
    },
  },
  defaultValues: {
    size: 'md',
  },
  transform(props, _helpers) {
    const { inline, size, dimmed, lh, fw, likec4color, nouserselect, medium, semibold, ...rest } = props
    if (dimmed && likec4color) {
      throw new Error('dimmed and likec4color are mutually exclusive')
    }
    const hasNoTextStyle = !(typeof rest['textStyle'] === 'string' && rest['textStyle'] !== '')
    const hasLhOrFw = !!lh || !!fw
    return {
      cursor: 'default',
      ...(inline && { display: 'inline-block' }),
      ...(likec4color && { 'data-likec4-color': likec4color }),
      ...(nouserselect && { userSelect: 'none' }),
      ...(hasNoTextStyle && !hasLhOrFw && {
        textStyle: dimmed ? `dimmed.${size}` : size,
      }),
      ...(hasNoTextStyle && hasLhOrFw && {
        fontSize: size,
        // color: dimmed ? 'text.dimmed' : 'text',
      }),
      ...(medium && { fontWeight: 'medium' }),
      ...(semibold && { fontWeight: 'semibold' }),
      ...(lh && { lineHeight: lh }),
      ...(fw && { fontWeight: fw }),
      ...rest,
    }
  },
  jsxElement: 'div',
  jsxName: 'Txt',
  jsx: ['Txt'],
})
