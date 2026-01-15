import { defineTextStyles } from '@pandacss/dev'

export const textStyles = defineTextStyles({
  dimmed: {
    xxs: {
      value: {
        fontSize: '0.625rem',
        lineHeight: '1rem',
        color: 'text.dimmed',
      },
    },
    xs: {
      value: {
        fontSize: '0.75rem',
        lineHeight: '1rem',
        color: 'text.dimmed',
      },
    },
    sm: {
      value: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        color: 'text.dimmed',
      },
    },
  },
  xxs: {
    value: {
      fontSize: '0.625rem',
      lineHeight: '1rem',
    },
  },
  xs: {
    value: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
    },
  },
  sm: {
    value: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
  },
  md: {
    value: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
  },
  lg: {
    value: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
    },
  },
  xl: {
    value: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
  },
  likec4: {
    panel: {
      DEFAULT: {
        description: 'Text style for panel content',
        value: {
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          fontWeight: 'medium',
          color: 'likec4.panel.text',
        },
      },
      action: {
        description: 'Text style for panel action items',
        value: {
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
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
