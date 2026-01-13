import { defineTextStyles } from '@pandacss/dev'

// export const title = style({
//   flex: '0 0 auto',
//   fontFamily: vars.element.font,
//   fontOpticalSizing: 'auto',
//   fontStyle: 'normal',
//   textAlign: textAlign,
//   fontWeight: 500,
//   fontSize: textSize,
//   lineHeight: 1.15,
//   textWrap: 'balance',
//   color: vars.element.hiContrast,
//   whiteSpaceCollapse: 'preserve-breaks',
// })

// export const description = style({
//   flex: '0 1 auto',
//   fontFamily: vars.element.font,
//   fontOpticalSizing: 'auto',
//   fontStyle: 'normal',
//   fontWeight: 400,
//   fontSize: calc(textSize).multiply(0.74).toString(),
//   lineHeight: 1.2,
//   textAlign: textAlign,
//   textWrap: 'pretty',
//   color: vars.element.loContrast,
//   whiteSpaceCollapse: 'preserve-breaks',
//   textOverflow: 'ellipsis',
//   overflow: 'hidden',
//   selectors: {
//     [`:where([data-likec4-shape-size="xs"]) &`]: {
//       display: 'none',
//     },
//   },
// })

// export const technology = style({
//   flex: '0 0 auto',
//   fontFamily: vars.element.font,
//   fontOpticalSizing: 'auto',
//   fontStyle: 'normal',
//   fontWeight: 400,
//   fontSize: calc(textSize).multiply(0.635).toString(),
//   lineHeight: 1.125,
//   textAlign: textAlign,
//   textWrap: 'balance',
//   opacity: 0.92,
//   color: vars.element.loContrast,
//   selectors: {
//     [`:where([data-hovered='true']) &`]: {
//       opacity: 1,
//     },
//     [`:where([data-likec4-shape-size="xs"], [data-likec4-shape-size="sm"]) &`]: {
//       display: 'none',
//     },
//   },
// })

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
    node: {
      primary: {
        description: 'Primary text, usually a title or name',
        value: {
          fontFamily: 'var(--likec4-element-font, {fonts.likec4})',
          fontWeight: 'medium',
          fontSize: 'var(--likec4-text-size)',
          lineHeight: 1.15,
          textWrapStyle: 'balance',
          whiteSpace: 'preserve-breaks',
        },
      },
      secondary: {
        description: 'Secondary text, usually a description or technology',
        value: {
          fontFamily: 'var(--likec4-element-font, {fonts.likec4})',
          fontWeight: 'medium',
          fontSize: `[calc(var(--likec4-text-size) * 0.74)]`,
          lineHeight: 1.3,
          textWrapStyle: 'pretty',
          '--text-fz': `[calc(var(--likec4-text-size) * 0.74)]`,
        },
      },
    },
  },
})
