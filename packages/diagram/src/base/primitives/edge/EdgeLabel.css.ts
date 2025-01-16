import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, xyvars } from '../../../theme-vars'
import { dimmed, mixColor } from './edge.css'

export { container, dimmed } from './edge.css'

const labelBorderRadius = 2
export const stepEdgeNumber = style({
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
    [`:where([data-edge-active='true']) &`]: {
      backgroundColor: 'transparent',
    },
  },
})

export const varLabelX = createVar('label-x')
export const varLabelY = createVar('label-y')

const varTranslate = createVar('translate')

export const edgeLabel = style({
  top: 0,
  left: 0,
  padding: '2px 4px 4px 4px',
  fontFamily: vars.likec4.font,
  display: 'flex',
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  width: 'fit-content',
  transformOrigin: '50% 50%',
  mixBlendMode: 'plus-lighter',
  color: xyvars.edge.labelColor,
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: labelBorderRadius,
  transform: varTranslate,
  vars: {
    [varTranslate]: `translate(${fallbackVar(varLabelX, '-50%')}, ${fallbackVar(varLabelY, '-50%')})`,
  },
  selectors: {
    '&[data-edge-hovered="true"]': {
      transition: 'all 140ms ease-in-out',
      transform: `${varTranslate} scale(1.12)`,
    },
    [`&:has(${stepEdgeNumber})`]: {
      padding: 0,
      gap: 2,
    },
    [`&:is(${dimmed})`]: {
      opacity: 0.3,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
      willChange: 'opacity, filter',
    },
  },
})

export const edgeLabelText = style({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: rem(14),
  lineHeight: 1.185,
})

export const edgeLabelTechnology = style({
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
  zIndex: 9,
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
  zIndex: 'calc(var(--layer-overlays, 1) + 1)',
  pointerEvents: 'all',
  color: xyvars.edge.labelColor,
  cursor: 'pointer',
  opacity: 1,
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
})
globalStyle(`${actionBtn} .tabler-icon`, {
  width: '80%',
  height: '80%',
  strokeWidth: 2,
})
