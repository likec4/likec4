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
  likec4: {
    node: {
      primary: {
        description: 'Primary text, usually a title or name',
        value: {
          fontFamily: 'var(--likec4-element-font, {fonts.likec4})',
          fontWeight: '500',
          fontSize: '[var(--likec4-text-size)]',
          lineHeight: '1.15',
          textWrap: 'balance',
          whiteSpace: 'preserve-breaks',
        },
      },
      secondary: {
        description: 'Secondary text, usually a description or technology',
        value: {
          fontFamily: 'var(--likec4-element-font, {fonts.likec4})',
          fontWeight: '400',
          fontSize: `[calc(var(--likec4-text-size) * 0.74)]`,
          lineHeight: '1.2',
          textWrap: 'pretty',
          whiteSpace: 'preserve-breaks',
        },
      },
    },
  },
})
