import { type Config, definePattern } from '@pandacss/dev'
import type { LiteralUnion } from '@pandacss/types'
import { type ThemeColor, ThemeColors } from './defaults/types'

type ExtendablePatternConfig = NonNullable<Config['patterns']>

const txt = definePattern({
  properties: {
    inline: {
      type: 'boolean',
    },
    dimmed: {
      type: 'boolean',
    },
    lh: {
      type: 'token',
      value: 'lineHeights',
    },
    size: {
      type: 'enum',
      value: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
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
  },
  transform(props, helpers) {
    const { inline, size, dimmed, lh, likec4color, ...rest } = props
    if (dimmed && likec4color) {
      throw new Error('dimmed and likec4color are mutually exclusive')
    }
    return {
      userSelect: 'all',
      cursor: 'default',
      textStyle: dimmed ? `dimmed.${size}` : size,
      ...(inline && { display: 'inline-block' }),
      ...(lh && { lineHeight: lh }),
      ...(likec4color && { 'data-likec4-color': likec4color }),
      ...rest,
    }
  },
  jsxElement: 'div',
  jsxName: 'Txt',
  jsx: ['Txt'],
})

export const patterns: ExtendablePatternConfig = {
  extend: {
    vstack: {
      defaultValues: {
        alignItems: 'stretch',
        gap: 'sm',
      },
    },
    hstack: {
      defaultValues: {
        gap: 'sm',
      },
    },
    box: {
      jsx: ['Box', 'MarkdownBlock'],
    },
    txt,
  },
}
