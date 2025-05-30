import { defineLayerStyles } from '@pandacss/dev'

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
        borderColor: 'likec4.tag.border/30',
        borderRadius: 2,
      },
    },
  },
})
