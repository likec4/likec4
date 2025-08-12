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
      description: 'LikeC4 panel layer',
      value: {
        paddingBlock: '1',
        paddingInline: 'xs',
        borderRadius: '0',
        backgroundColor: {
          base: 'likec4.panel.bg',
          _reduceGraphicsOnPan: 'likec4.panel.bg.whenPanning',
        },
        border: '1px solid {colors.likec4.panel.border}',
        '@/sm': {
          boxShadow: 'lg',
          borderRadius: 'md',
          padding: '2xs',
          backdropFilter: 'blur(10px)',
        },
        _whenPanning: {
          boxShadow: 'none',
          borderRadius: '0',
          backdropFilter: 'none',
        },
      },
    },
    dropdown: {
      description: 'LikeC4 dropdown layer',
      value: {
        padding: 'xxs',
        backgroundColor: 'likec4.dropdown.bg',
        border: '1px solid {colors.likec4.dropdown.border}',
        boxShadow: 'lg',
        borderRadius: 'md',
        _whenPanning: {
          boxShadow: 'none',
          borderRadius: '0px',
          borderColor: 'transparent',
        },
      },
    },
  },
})
