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
    dimmed: {
      description: 'Whether the text should be dimmed (default: false)',
      type: 'boolean',
    },
    noUserSelect: {
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
    likec4color: {
      type: 'enum',
      value: [...ThemeColors] as Array<LiteralUnion<ThemeColor>>,
    },
  },
  defaultValues: {
    inline: false,
    dimmed: false,
    size: 'md',
    noUserSelect: false,
  },
  transform(props, _helpers) {
    const { inline, size, dimmed, lh, likec4color, noUserSelect, ...rest } = props
    if (dimmed && likec4color) {
      throw new Error('dimmed and likec4color are mutually exclusive')
    }
    const hasNoTextStyle = rest['textStyle'] == null
    return {
      cursor: 'default',
      ...(inline && { display: 'inline-block' }),
      ...(likec4color && { 'data-likec4-color': likec4color }),
      ...(noUserSelect && { userSelect: 'none' }),
      ...(lh && { lineHeight: lh }),
      ...(hasNoTextStyle ?
        {
          textStyle: dimmed ? `dimmed.${size}` : size,
        } :
        {
          fontSize: size,
          color: dimmed ? 'text.dimmed' : 'text',
        }),
      ...rest,
    }
  },
  jsxElement: 'div',
  jsxName: 'Txt',
  jsx: ['Txt'],
})
