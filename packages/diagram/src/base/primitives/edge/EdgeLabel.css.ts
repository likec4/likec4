import { css } from '@likec4/styles/css'
import { cssVar } from '@likec4/styles/vars'
// import { createVar, fallbackVar, globalStyle } from '@vanilla-extract/css'
// import {
//   easings,
//   mantine,
//   transitions,
//   vars,
//   whereLight,
//   whereNotReducedGraphics,
//   xyvars,
// } from '../../../theme-vars'
// import { edgeVars, mixColor } from './edge.css'

const labelBorderRadius = '4px'
export const stepEdgeNumber = css({
  alignSelf: 'stretch',
  flex: '0 0 auto',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '1',
  padding: '5px 5px',
  textAlign: 'center',
  minWidth: '22px',
  borderTopLeftRadius: labelBorderRadius,
  borderBottomLeftRadius: labelBorderRadius,
  backgroundColor: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 5%)]`,
  fontVariantNumeric: 'tabular-nums',
  // selectors: {
  //   [`${whereDark} :where([data-likec4-color="gray"]) &`]: {
  //     backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, ${mixColor} 15%)`,
  //   },
  //   [`:where([data-edge-active='true'], [data-edge-hovered="true"]) &`]: {
  //     transition: transitions.fast,
  //     backgroundColor: 'transparent',
  //   },
  // },
})

// export const varLabelX = createVar('label-x')
// export const varLabelY = createVar('label-y')

export const _translate = '--edge-translate'
const varTranslate = `var(${_translate})`

export const edgeLabelContainer = css({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  width: 'auto',
  height: 'auto',
  background: `xyedge.label.bg`,
  color: `xyedge.label`,
  border: '0px solid transparent',
  // _whenDimmed: {
  //   opacity: 0.2,
  //   transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
  //   transitionDelay: '200ms',
  //   // filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  // },
  // _whenDimmedImmediate: {
  //   opacity: 0.1,
  //   transition: 'opacity 75ms ease-in-out, filter 100ms ease-in-out',
  //   // filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  // },
  _notReducedGraphics: {
    borderRadius: labelBorderRadius,
    mixBlendMode: 'plus-lighter',
    transform: varTranslate,
    transition: 'fast',
    _whenHovered: {
      transition: `all 190ms {easings.inOut}`,
      transform: `${varTranslate} scale(1.12)`,
    },
    _light: {
      mixBlendMode: 'screen',
    },
  },
})

export const edgeLabel = css({
  fontFamily: 'likec4.relation',
  padding: '3px 5px 5px 5px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 'max-content',
  maxWidth: '100%',
  gap: '4',
  // position: 'absolute',
  // pointerEvents: 'all',
  // cursor: 'pointer',
  // width: 'fit-content',
  // // transformOrigin: '50% 50%',
  // mixBlendMode: 'plus-lighter',
  //
  // // transform: varTranslate,
  // transition: transitions.fast,
  // vars: {
  //   [varTranslate]: `translate(${fallbackVar(varLabelX, '-50%')}, ${fallbackVar(varLabelY, '-50%')})`,
  // },
  //
  // [`&:has(${stepEdgeNumber})`]: {
  // flexDirection: 'row',
  // padding: '0',
  // gap: '0',
  // },
})

export const secondColumn = css({
  display: 'contents',
  _empty: {
    display: 'none !important',
  },
  // selectors: {
  //   [`${edgeLabel}:has(${stepEdgeNumber}) &`]: {
  //     flex: 1,
  //     display: 'flex',
  //     flexDirection: 'column',
  //     alignItems: 'center',
  //     // width: 'max-content',
  //     // maxWidth: '100%',
  //     // gap: rem(4),
  //     padding: '1px 5px 5px 5px',
  //   },
  // },
  // ':empty': {
  //   display: 'none !important',
  // },
})

export const edgeLabelText = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: '14px',
  lineHeight: 1.185,
  color: `xyedge.label`,
})

export const edgeLabelTechnology = css({
  color: `xyedge.label`,
  textAlign: 'center',
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: '11px',
  lineHeight: 1,
  opacity: 0.75,
})

// globalStyle(`${edgeLabel}:has(${stepEdgeNumber}) ${edgeLabelText}`, {
//   padding: '2px 5px 4px 2px',
// })

export const edgeNoteCloseButton = css({
  position: 'absolute',
  top: 4,
  right: 4,
  // zIndex: 9,
})

export const edgeNoteText = css({
  userSelect: 'all',
  textAlign: 'left',
  whiteSpaceCollapse: 'preserve-breaks',
  textWrap: 'pretty',
  lineHeight: '1.25',
  '--text-fz': '{fontSizes.sm}',
  md: {
    '--text-fz': '{fontSizes.md}',
  },
})

const aiBg = cssVar.create('ai-bg')
export const actionBtn = css({
  // zIndex: 'calc(var(--layer-overlays, 1) + 1)',
  pointerEvents: 'all',
  color: `xyedge.label`,
  cursor: 'pointer',
  opacity: 0.75,
  transition: 'fast',
  backgroundColor: `[${aiBg.ref}]`,
  [aiBg.var]: '{colors.likec4.relation.label.bg}',
  '--ai-hover': `color-mix(in srgb , {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 10%)`,
  _hover: {
    translateY: '1px',
    scale: 1.15,
  },
  _active: {
    translateY: '-1px',
    scale: '0.9',
  },
  _whenHovered: {
    opacity: 1,
  },
  '& .tabler-icon': {
    width: '80%',
    height: '80%',
    strokeWidth: '2',
  },
})
