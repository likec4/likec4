import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import {
  easings,
  mantine,
  transitions,
  vars,
  whereDark,
  whereLight,
  whereNotReducedGraphics,
  xyvars,
} from '../../../theme-vars'
import { edgeVars, mixColor } from './edge.css'

const labelBorderRadius = 4
export const stepEdgeNumber = style({
  alignSelf: 'stretch',
  flex: '0 0 auto',
  fontWeight: 600,
  fontSize: rem(14),
  lineHeight: 1,
  padding: '5px 5px',
  textAlign: 'center',
  minWidth: 22,
  borderTopLeftRadius: labelBorderRadius,
  borderBottomLeftRadius: labelBorderRadius,
  backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, ${mixColor} 5%)`,
  fontVariantNumeric: 'tabular-nums',
  selectors: {
    [`${whereDark} :where([data-likec4-color="gray"]) &`]: {
      backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, ${mixColor} 15%)`,
    },
    [`:where([data-edge-active='true'], [data-edge-hovered="true"]) &`]: {
      transition: transitions.fast,
      backgroundColor: 'transparent',
    },
  },
})

export const varLabelX = createVar('label-x')
export const varLabelY = createVar('label-y')

export const edgeLabelContainer = style([edgeVars, {
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  width: 'auto',
  height: 'auto',
  backgroundColor: xyvars.edge.labelBgColor,
  border: '0px solid transparent',
  selectors: {
    [`&:is([data-edge-dimmed="true"])`]: {
      opacity: 0.2,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
    [`&:is([data-edge-dimmed="immediate"])`]: {
      opacity: 0.1,
      transition: 'opacity 75ms ease-in-out, filter 100ms ease-in-out',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
    [`${whereNotReducedGraphics} &`]: {
      borderRadius: labelBorderRadius,
      mixBlendMode: 'plus-lighter',
      transition: transitions.fast,
    },
    [`${whereNotReducedGraphics} &[data-edge-hovered="true"]`]: {
      transition: `all 190ms ${easings.inOut}`,
      transform: `scale(1.12)`,
    },
    [`${whereLight} ${whereNotReducedGraphics} &`]: {
      mixBlendMode: 'screen',
    },
  },
}])

export const edgeLabel = style({
  fontFamily: vars.likec4.font,
  padding: '3px 5px 5px 5px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 'max-content',
  maxWidth: '100%',
  gap: rem(4),
  // position: 'absolute',
  // pointerEvents: 'all',
  // cursor: 'pointer',
  // width: 'fit-content',
  // // transformOrigin: '50% 50%',
  // mixBlendMode: 'plus-lighter',
  color: xyvars.edge.labelColor,
  // // transform: varTranslate,
  // transition: transitions.fast,
  // vars: {
  //   [varTranslate]: `translate(${fallbackVar(varLabelX, '-50%')}, ${fallbackVar(varLabelY, '-50%')})`,
  // },
  //
  selectors: {
    [`&:has(${stepEdgeNumber})`]: {
      flexDirection: 'row',
      padding: 0,
      gap: 0,
    },
  },
})

export const secondColumn = style({
  display: 'contents',
  selectors: {
    [`${edgeLabel}:has(${stepEdgeNumber}) &`]: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // width: 'max-content',
      // maxWidth: '100%',
      // gap: rem(4),
      padding: '1px 5px 5px 5px',
    },
  },
  ':empty': {
    display: 'none !important',
  },
})

export const edgeLabelText = style({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: rem(14),
  lineHeight: 1.185,
  color: xyvars.edge.labelColor,
})

export const edgeLabelTechnology = style({
  color: xyvars.edge.labelColor,
  textAlign: 'center',
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: rem(11),
  lineHeight: 1,
  opacity: 0.75,
})

globalStyle(`${edgeLabel}:has(${stepEdgeNumber}) ${edgeLabelText}`, {
  padding: '2px 5px 4px 2px',
})

export const edgeNoteCloseButton = style({
  position: 'absolute',
  top: 4,
  right: 4,
  // zIndex: 9,
})

export const edgeNoteText = style({
  userSelect: 'all',
  textAlign: 'left',
  whiteSpaceCollapse: 'preserve-breaks',
  textWrap: 'pretty',
  lineHeight: 1.25,
  vars: {
    '--text-fz': mantine.fontSizes.sm,
  },
  '@media': {
    [mantine.largerThan('md')]: {
      vars: {
        '--text-fz': mantine.fontSizes.md,
      },
    },
  },
})

export const actionBtn = style({
  // zIndex: 'calc(var(--layer-overlays, 1) + 1)',
  pointerEvents: 'all',
  color: xyvars.edge.labelColor,
  cursor: 'pointer',
  opacity: 0.75,
  transition: transitions.fast,
  backgroundColor: 'var(--ai-bg)',
  vars: {
    '--ai-bg': vars.relation.labelBgColor,
    '--ai-hover': `color-mix(in srgb , ${vars.relation.labelBgColor}, ${mixColor} 10%)`,
  },
  ':hover': {
    transform: 'translateY(1px) scale(1.15)',
  },
  ':active': {
    transform: 'translateY(-1px) scale(0.9)',
  },
  selectors: {
    ':where([data-edge-hovered="true"]) &': {
      opacity: 1,
    },
  },
})
globalStyle(`${actionBtn} .tabler-icon`, {
  width: '80%',
  height: '80%',
  strokeWidth: 2,
})
