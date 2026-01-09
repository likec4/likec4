import { defineLayerStyles } from '@pandacss/dev'

export const layerStyles = defineLayerStyles({
  likec4: {
    tag: {
      description: 'LikeC4 tag layer',
      value: {
        color: 'likec4.tag.text',
        backgroundColor: 'likec4.tag.bg',
        _hover: {
          backgroundColor: 'likec4.tag.bg.hover',
        },
        border: 'none',
        borderRadius: 3,
      },
    },
    panel: {
      DEFAULT: {
        description: 'LikeC4 panel layer',
        value: {
          padding: '1',
          borderRadius: '0',
          backgroundColor: 'likec4.panel.bg',
          border: '1px solid {colors.likec4.panel.border}',
          '@/sm': {
            boxShadow: 'lg',
            borderRadius: 'md',
            paddingInline: '2',
          },
          _reduceGraphicsOnPan: {
            boxShadow: 'none',
          },
        },
      },
      action: {
        DEFAULT: {
          description: 'LikeC4 panel action layer',
          value: {
            color: {
              base: 'likec4.panel.action',
              _disabled: 'likec4.panel.action.disabled',
              _notDisabled: {
                _hover: 'likec4.panel.action.hover',
              },
            },
            cursor: {
              base: 'pointer',
              _disabled: 'not-allowed',
            },
            paddingInline: 'xxs',
            paddingBlock: 'xxs',
            border: 'transparent',
            borderRadius: 'sm',
            backgroundColor: {
              _notDisabled: {
                _hover: 'likec4.panel.action.bg.hover',
              },
            },
          },
        },

        filled: {
          description: 'LikeC4 action panel filled layer',
          value: {
            color: {
              base: 'likec4.panel.action',
              _disabled: 'likec4.panel.action.disabled',
              _notDisabled: {
                _hover: 'likec4.panel.action.hover',
              },
            },
            cursor: {
              base: 'pointer',
              _disabled: 'not-allowed',
            },
            paddingInline: 'xxs',
            paddingBlock: 'xxs',
            border: 'transparent',
            borderRadius: 'sm',
            backgroundColor: {
              base: 'likec4.panel.action.bg',
              _disabled: 'likec4.panel.action.bg',
              _notDisabled: {
                _hover: 'likec4.panel.action.bg.hover',
              },
            },
          },
        },
      },
    },
    dropdown: {
      description: 'LikeC4 dropdown layer',
      value: {
        padding: '2',
        backgroundColor: 'likec4.dropdown.bg',
        border: '1px solid {colors.likec4.dropdown.border}',
        boxShadow: 'lg',
        borderRadius: 'md',
      },
    },
  },
})
