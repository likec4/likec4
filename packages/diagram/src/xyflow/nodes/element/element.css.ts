import { rem } from '@mantine/core'
import { createVar, fallbackVar, generateIdentifier, globalKeyframes, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../mantine.css'
import { vars } from '../../../theme.css'

export const stokeFillMix = createVar('stroke-fill-mix')
const elPadding = createVar('el-padding')
// assignVars

export const container = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  backfaceVisibility: 'hidden',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  }
})

export const dimmed = style({})

globalStyle(`.react-flow__node:has(${dimmed})`, {
  filter: vars.filterDimmed,
  transition: 'filter 800ms ease-out'
})

const indicatorKeyframes = generateIdentifier('indicator')
globalKeyframes(indicatorKeyframes, {
  'from': {
    opacity: 0.6
  },
  'to': {
    opacity: 0.4
  }
})

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke
)

export const indicator = style({
  stroke: vars.element.loContrast,
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  visibility: 'hidden',
  selectors: {
    ':where(.react-flow__node.selected) &': {
      visibility: 'visible'
    },
    [`:where(.react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      animationName: 'none',
      strokeWidth: 10,
      stroke: outlineColor,
      visibility: 'visible'
    },
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10
    }
  }
})

export const fillElementFill = style({
  fill: vars.element.fill
})

export const fillElementStroke = style({
  fill: vars.element.stroke
})

export const fillMixStroke = style({
  fill: stokeFillMix
})

export const title = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: 'center',
  fontWeight: 500,
  fontSize: rem(19),
  lineHeight: 1.2,
  textWrap: 'balance',
  color: vars.element.hiContrast
})

export const description = style({
  flex: '0 1 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: rem(14),
  lineHeight: 1.25,
  textAlign: 'center',
  textWrap: 'pretty',
  color: vars.element.loContrast,
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: rem(12),
  lineHeight: 1.125,
  textAlign: 'center',
  textWrap: 'balance',
  opacity: 0.92,
  color: vars.element.loContrast,
  selectors: {
    [`${container}:hover &`]: {
      opacity: 1
    }
  }
})

export const element = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: elPadding,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  overflow: 'hidden',
  gap: rem(8),
  'vars': {
    [elPadding]: rem(24)
  },
  selectors: {
    [`&:has(${description}):has(${technology})`]: {
      gap: rem(6)
    },
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: rem(40),
      paddingRight: rem(20)
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: rem(34)
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: rem(32),
      paddingBottom: rem(28)
    }
  }
})

export const iconMaxH = createVar('max-h')

export const elementIcon = style({
  flex: `0 1 ${iconMaxH}`,
  maxHeight: iconMaxH,
  marginTop: -8,
  // display: 'flex',
  // justifyContent: 'flex-end',
  // flexDirection: 'column',
  // alignItems: 'center',
  position: 'relative',
  userSelect: 'none',
  pointerEvents: 'none',
  overflow: 'visible',
  mixBlendMode: 'hard-light',
  'vars': {
    [iconMaxH]: '30px'
  }
})

globalStyle(`${elementIcon} img`, {
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '100%',
  height: 'auto',
  objectFit: 'contain',
  maxHeight: `calc(${iconMaxH} + 16px)`
})

const filterShadow = createVar('filter-shadow')
const filterShadowHovered = createVar('filter-shadow-hovered')

export const cssShapeSvg = style({
  top: '0px',
  left: '0px',
  position: 'absolute',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: fallbackVar(filterShadowHovered, filterShadow),
  transition: 'filter 300ms ease-out',
  transitionDelay: '0ms',
  vars: {
    [filterShadow]: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `
  },
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      filter: 'none'
    }
  }
})

export const cssNavigateBtn = style({
  zIndex: 'calc(var(--layer-overlays, 1) + 1)',
  position: 'absolute',
  pointerEvents: 'all',
  left: '50%',
  bottom: 0,
  color: vars.element.loContrast,
  cursor: 'pointer',
  transformOrigin: '50% 65%',
  opacity: 0.75,
  transition: 'all 150ms ease-out',
  transform: 'translate(-50%, 0)',
  transitionDelay: '0ms',
  backgroundColor: 'var(--ai-bg)',
  'vars': {
    '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`
  },
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      bottom: 3
    },
    [`:where(.react-flow__node:not(.dragging) ${container}:hover) &:not(:hover)`]: {
      boxShadow: mantine.shadows.lg,
      transform: 'translate(-50%, 0) scale(1.185)',
      opacity: 1,
      transitionDelay: '250ms',
      vars: {
        '--ai-bg': 'var(--ai-bg-hover)'
      }
    }
  },
  ':hover': {
    boxShadow: mantine.shadows.lg,
    transform: 'translate(-50%, 0) scale(1.35)',
    opacity: 1,
    transitionDelay: '0'
  },
  ':active': {
    transform: 'translate(-50%, 0) scale(1.02)',
    opacity: 1,
    transitionDelay: '0'
  }
})
globalStyle(`${cssNavigateBtn} svg.icon`, {
  width: '65%',
  height: '65%',
  strokeWidth: '1.5'
})
