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
          _whenPanning: 'likec4.panel.bg.whenPanning',
        },
        border: '1px solid {colors.likec4.panel.border}',
        backdropFilter: 'blur(10px)',
        '@/sm': {
          boxShadow: 'lg',
          borderRadius: 'md',
          padding: '2xs',
        },
        _whenPanning: {
          boxShadow: 'none',
          borderRadius: '0',
        },
      },
    },
    dropdown: {
      description: 'LikeC4 dropdown layer',
      value: {
        paddingInline: '2xs',
        paddingBlock: '2xs',
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
