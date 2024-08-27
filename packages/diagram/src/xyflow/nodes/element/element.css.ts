import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { mantine } from '../../../mantine.css'
import { vars } from '../../../theme.css'

export const stokeFillMix = createVar('stroke-fill-mix')

export const container = style({
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  flex: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  },
  selectors: {
    ':where(.react-flow__node.selected) &': {
      willChange: 'transform'
    },
    '&[data-hovered="true"]': {
      willChange: 'transform'
    }
  }
})

export const handleCenter = style({
  top: '50%',
  left: '50%',
  visibility: 'hidden'
})

export const containerAnimated = style({
  willChange: 'transform'
})

export const dimmed = style({})

globalStyle(`.react-flow__node-element:has(${dimmed})`, {
  opacity: 0.25,
  transition: 'opacity 400ms ease-in-out, filter 500ms ease-in-out',
  transitionDelay: '50ms',
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
  willChange: 'opacity, filter'
})

const indicatorKeyframes = keyframes({
  'from': {
    strokeOpacity: 0.8
  },
  'to': {
    strokeOpacity: 0.5
  }
})

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke
)

const indicatorStroke = createVar('indicator-stroke')

export const indicator = style({
  stroke: indicatorStroke,
  fill: 'none',
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '1s',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  strokeOpacity: 0.8,
  visibility: 'hidden',
  vars: {
    [indicatorStroke]: vars.element.loContrast
  },
  selectors: {
    ':where(.react-flow__node.selected) &': {
      visibility: 'visible',
      animationName: fallbackVar(vars.safariAnimationHook, indicatorKeyframes)
    },
    [`:where(.react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      strokeWidth: 10,
      stroke: outlineColor,
      visibility: 'visible'
    },
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10
    },
    [`:where([data-mantine-color-scheme='light']) &`]: {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.fill} 50%, #3c3c3c)`
      }
    },
    [`${dimmed} &`]: {
      visibility: 'hidden',
      display: 'none'
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

export const hasIcon = style({})

const textAlign = createVar('text-align')
const iconSize = createVar('icon-size')

export const title = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: textAlign,
  fontWeight: 500,
  fontSize: 19,
  lineHeight: 1.15,
  textWrap: 'balance',
  color: vars.element.hiContrast
})

export const description = style({
  flex: '0 1 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.2,
  textAlign: textAlign,
  textWrap: 'pretty',
  color: vars.element.loContrast,
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  selectors: {
    [`:where(${hasIcon}) &`]: {
      textWrap: 'wrap'
    }
  }
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 12,
  lineHeight: 1.125,
  textAlign: textAlign,
  textWrap: 'balance',
  opacity: 0.92,
  color: vars.element.loContrast,
  selectors: {
    [`${container}:hover &`]: {
      opacity: 1
    }
  }
})

export const elementDataContainer = style({
  flex: '1',
  height: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  padding: rem(24),
  overflow: 'hidden',
  gap: rem(10),
  vars: {
    [iconSize]: '48px'
  },
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: 40,
      paddingRight: 20
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: 30
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: 32,
      paddingBottom: 28
    },
    // [`&:is(${hasIcon})`]: {
    //   paddingLeft: 40,
    //   paddingRight: 20
    // },
    [`${container}:not(:is([data-likec4-shape="queue"],[data-likec4-shape="mobile"])) &:is(${hasIcon})`]: {
      paddingLeft: 24,
      paddingRight: 18
    },
    [`&:has(${description}, ${technology})`]: {
      gap: rem(16),
      vars: {
        [iconSize]: '60px'
      }
    }
  }
})

export const elementTextData = style({
  height: 'fit-content',
  width: 'max-content',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  flexWrap: 'nowrap',
  overflow: 'hidden',
  gap: rem(8),
  'vars': {
    [textAlign]: 'center'
  },
  selectors: {
    [`&:has(${description}):has(${technology})`]: {
      gap: rem(6)
    },
    [`:where(${hasIcon}) &`]: {
      minWidth: 'calc(100% - 160px)',
      alignItems: 'flex-start',
      'vars': {
        [textAlign]: 'left'
      }
    }
  }
})

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
  alignSelf: 'flex-start'
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 12%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain'
})

const filterShadow = createVar('filter-shadow')

export const cssShapeSvgMultiple = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  transformOrigin: '50% 50%',
  fill: vars.element.fill,
  stroke: 'none',
  zIndex: -1,
  transition: 'opacity 500ms ease-out',
  transform: 'translate(8px,10px)',
  opacity: 0.5,
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      visibility: 'hidden'
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      transform: 'translate(8px,8px)'
    },
    ':where([data-likec4-shape="queue"]) &': {
      transform: 'translate(-10px,8px)'
    },
    ':where([data-hovered="true"]) &': {
      transition: 'opacity 300ms ease-in',
      opacity: 0.2
    }
  }
})
export const cssShapeSvg = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: filterShadow,
  transition: 'filter 300ms ease-out',
  transitionDelay: '0ms',
  zIndex: -1,
  vars: {
    [filterShadow]: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `
  },
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      vars: {
        [filterShadow]: `none`
      }
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
