import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars } from '../../../theme-vars'

const iconSize = createVar('icon-size')

export const elementNode = style({
  width: '100%',
  height: '100%',
  vars: {
    [iconSize]: '64px',
  },
})

export const elementNodeContent = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  gap: 6,
  padding: 16,

  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: 40,
      paddingRight: 20,
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: 30,
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: 32,
      paddingBottom: 28,
    },
  },
})

export const elementNodeTextContent = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  flex: '0 1 auto',
  gap: 6,
})

export const elementNodeTitle = style({
  flex: '0 0 auto',
  width: 'fit-content',
  textAlign: 'center',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: 17,
  lineHeight: 1.25,
  textWrap: 'balance',
  color: vars.element.hiContrast,
})

export const elementNodeDescription = style({
  flex: '0 0 auto',
  width: 'fit-content',
  textAlign: 'center',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontSize: mantine.fontSizes.xs,
  lineHeight: 1.25,
  textWrap: 'balance',
  color: vars.element.loContrast,
})

export const compoundNodeBody = style({
  width: '100%',
  height: '100%',
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
  borderRadius: 4,
  vars: {
    [iconSize]: '18px',
  },
})

export const compoundNodeTitle = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingTop: 12,
  paddingLeft: 10,
})

export const compoundNodeTitleText = style({
  flex: '1 1 auto',
  fontFamily: vars.compound.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 1,
  textTransform: 'uppercase',
  mixBlendMode: 'screen',
  color: vars.compound.titleColor,
})

export const cssShapeSvg = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `,
  zIndex: -1,
})

export const navigateBtnBox = style({
  zIndex: 100,
  position: 'absolute',
  left: '50%',
  bottom: 2,
  transform: 'translate(-50%, 0%)',
  gap: 0,
  transition: 'all 190ms cubic-bezier(0.5, 0, 0.4, 1)',
  selectors: {
    [`:where([data-likec4-shape='browser'],[data-likec4-shape='mobile']) &`]: {
      bottom: 6,
    },
  },
})
globalStyle(`:where(${elementNode}:hover) ${navigateBtnBox}`, {
  transitionDelay: '20ms',
  gap: 8,
  transform: 'translate(-50%, 5px)',
})

export const navigateBtn = style({
  opacity: 0.7,
  pointerEvents: 'all',
  cursor: 'pointer',
  transform: 'scale(0.9)',
  transition: 'all 190ms cubic-bezier(0.5, 0, 0.4, 1)',
  'vars': {
    '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  ':hover': {
    transitionDelay: '0ms',
    transform: 'scale(1.25)',
    boxShadow: mantine.shadows.lg,
  },
  ':active': {
    transform: 'scale(0.975)',
  },
})

globalStyle(`:where(${elementNode}:hover) ${navigateBtn}`, {
  transitionDelay: '40ms',
  transitionTimingFunction: 'cubic-bezier(0, 0, 0.40, 1)',
  opacity: 1,
  transform: 'scale(1.07)',
  boxShadow: mantine.shadows.md,
  vars: {
    '--ai-bg': `var(--ai-bg-hover)`,
  },
})
// globalStyle(`${elementNode}:hover ${navigateBtn}`, {
//   opacity: 1,
//   transform: 'scale(1.05)',
//   boxShadow: mantine.shadows.md,
//   vars: {
//     '--ai-bg': `var(--ai-bg-hover)`
//   }
// })

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 10%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `,
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain',
})
