import { type CompositionStyles, defineTextStyles as _defineTextStyles } from '@pandacss/dev'

function defineTextStyles<const T extends CompositionStyles['textStyles']>(definition: T): T {
  return _defineTextStyles(definition) as T
}

export const textStyles = defineTextStyles({
  dimmed: {
    DEFAULT: {
      description: 'Text style for dimmed content',
      value: {
        fontSize: 'md',
        lineHeight: 'md',
        color: 'text.dimmed',
      },
    },
    xxs: {
      value: {
        fontSize: 'xxs',
        lineHeight: 'xxs',
        color: 'text.dimmed',
      },
    },
    xs: {
      value: {
        fontSize: 'xs',
        lineHeight: 'xs',
        color: 'text.dimmed',
      },
    },
    sm: {
      value: {
        fontSize: 'sm',
        lineHeight: 'sm',
        color: 'text.dimmed',
      },
    },
    md: {
      value: {
        fontSize: 'md',
        lineHeight: 'md',
        color: 'text.dimmed',
      },
    },
  },
  xxs: {
    value: {
      fontSize: 'xxs',
      lineHeight: 'xxs',
    },
  },
  xs: {
    value: {
      fontSize: 'xs',
      lineHeight: 'xs',
    },
  },
  sm: {
    value: {
      fontSize: 'sm',
      lineHeight: 'sm',
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
    DEFAULT: {
      description: 'Text style for panel content',
      value: {
        fontSize: 'md',
        lineHeight: 'md',
        fontWeight: 'normal',
        color: 'text',
      },
    },
    panel: {
      DEFAULT: {
        description: 'Text style for panel content',
        value: {
          fontSize: 'sm',
          lineHeight: 'sm',
          fontWeight: 'medium',
          color: 'likec4.panel.text',
        },
      },
      action: {
        description: 'Text style for panel action items',
        value: {
          fontSize: 'sm',
          lineHeight: 'sm',
          fontWeight: 'medium',
          color: {
            base: 'likec4.panel.action',
            _hover: 'likec4.panel.action.hover',
          },
        },
      },
    },
  },

  // type-colour axis (v1.8): h1/h2 carry the display tone, h3–h6 the heading tone
  h1: {
    value: {
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: 'h1',
      lineHeight: 'snug',
      letterSpacing: 'display',
      color: 'text.display',
    },
  },
  h2: {
    value: {
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: 'h2',
      lineHeight: 'snug',
      letterSpacing: 'display',
      color: 'text.display',
    },
  },
  h3: {
    value: { fontFamily: 'display', fontWeight: 'bold', fontSize: 'h3', lineHeight: 'snug', color: 'text.heading' },
  },
  h4: {
    value: { fontFamily: 'display', fontWeight: 'bold', fontSize: 'h4', lineHeight: 'snug', color: 'text.heading' },
  },
  h5: {
    value: { fontFamily: 'display', fontWeight: 'bold', fontSize: 'h5', lineHeight: 'snug', color: 'text.heading' },
  },
  h6: {
    value: { fontFamily: 'display', fontWeight: 'bold', fontSize: 'h6', lineHeight: 'snug', color: 'text.heading' },
  },
  body: {
    value: { fontFamily: 'body', fontWeight: 'regular', fontSize: 'md', lineHeight: 'md', color: 'text' },
  },
  lead: {
    // measure cap (sizes.measure.lead) is applied by consumers — textStyles cover typography only
    value: { fontFamily: 'body', fontSize: 'lg', lineHeight: 'lg', color: 'text.dimmed' },
  },
  small: {
    value: { fontFamily: 'body', fontSize: 'sm', color: 'text.dimmed' },
  },
  caption: {
    value: { fontFamily: 'body', fontSize: 'xs', color: 'text.nonessential' },
  },
  eyebrow: {
    description: 'eyebrow / data label — Mono, all-caps, letter-spaced',
    value: {
      fontFamily: 'mono',
      fontWeight: 'medium',
      fontSize: 'xxs',
      textTransform: 'uppercase',
      letterSpacing: 'caps',
      color: 'text.nonessential',
    },
  },
})
