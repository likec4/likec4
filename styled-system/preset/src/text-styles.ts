import { defineTextStyles } from '@pandacss/dev'

export const textStyles = defineTextStyles({
  dimmed: {
    xxs: {
      value: {
        fontSize: 'xxs',
        lineHeight: '1',
        color: 'text.dimmed',
      },
    },
    xs: {
      value: {
        fontSize: 'xs',
        lineHeight: '1',
        color: 'text.dimmed',
      },
    },
    sm: {
      value: {
        fontSize: 'xs',
        lineHeight: '1.25em',
        color: 'text.dimmed',
      },
    },
  },
  xxs: {
    value: {
      fontSize: 'xxs',
      lineHeight: '1',
    },
  },
  xs: {
    value: {
      fontSize: 'xs',
      lineHeight: '1',
    },
  },
  sm: {
    value: {
      fontSize: 'sm',
      lineHeight: '1.25em',
    },
  },
  md: {
    value: {
      fontSize: 'md',
      lineHeight: 'md',
    },
  },
  lg: {
    value: {
      fontSize: 'lg',
      lineHeight: 'lg',
    },
  },
  xl: {
    value: {
      fontSize: 'xl',
      lineHeight: 'xl',
    },
  },
  likec4: {
    panel: {
      DEFAULT: {
        description: 'Text style for panel content',
        value: {
          fontSize: 'sm',
          lineHeight: '1.25em',
          fontWeight: 'medium',
          color: 'likec4.panel.text',
        },
      },
      action: {
        description: 'Text style for panel action items',
        value: {
          fontSize: 'sm',
          lineHeight: '1.25em',
          fontWeight: 'medium',
          color: {
            base: 'likec4.panel.action',
            _hover: 'likec4.panel.action.hover',
          },
        },
      },
    },
  },
})
