import type { Config } from '@pandacss/dev'
import { radixColors } from './const'

type ExtendablePatternConfig = NonNullable<Config['patterns']>

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
    likec4tag: {
      properties: {
        tagColor: {
          type: 'enum',
          value: radixColors,
        },
        customColor: {
          type: 'string',
        },
      },
      jsxName: 'LikeC4Tag',
      transform(props, h) {
        const { tagColor, customColor, ...rest } = props
        return {
          pointerEvents: 'all',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 40,
          minHeight: 8,
          color: 'likec4.tag.text',
          backgroundColor: 'likec4.tag.bg',
          _hover: {
            backgroundColor: 'likec4.tag.bg.hover',
          },
          border: 'none',
          // borderColor: 'likec4.tag.border',
          transition: 'fast',
          borderRadius: 3,
          ...(tagColor && { tagColor }),
          ...rest,
        }
      },
    },
  },
}
