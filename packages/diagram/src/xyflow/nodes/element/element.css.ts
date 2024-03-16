import { rem } from '@mantine/core'
import {
  assignVars,
  createVar,
  fallbackVar,
  generateIdentifier,
  globalKeyframes,
  globalStyle,
  style
} from '@vanilla-extract/css'
import { vars } from '../../../theme'

export const stokeFillMix = createVar('stroke-fill-mix')
const elPadding = createVar('el-padding')
// assignVars

export const container = style({
  position: 'relative',
  width: ['100%', '-webkit-fill-available'],
  height: ['100%', '-webkit-fill-available'],
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  }
})

const indicatorKeyframes = generateIdentifier('indicator')
globalKeyframes(indicatorKeyframes, {
  'from': {
    opacity: '0.6'
  },
  'to': {
    opacity: '0.4'
  }
})

export const indicator = style({
  // stroke: fallbackVar('var(--likec4-element-indicator)', vars.element.loContrast),
  stroke: fallbackVar(vars.element.loContrast),
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  visibility: 'hidden',
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10
    }
  }
})

globalStyle(`.react-flow__node.selected ${indicator}`, {
  visibility: 'visible'
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
  fontFamily: fallbackVar(vars.element.font),
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: 'center',
  fontWeight: 500,
  fontSize: rem(19),
  lineHeight: 1.22,
  textWrap: 'balance',
  color: fallbackVar(vars.element.hiContrast)
})

export const description = style({
  flex: '0 1 auto',
  fontFamily: fallbackVar(vars.element.font),
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: rem(14),
  lineHeight: 1.2,
  textAlign: 'center',
  textWrap: 'pretty',
  color: fallbackVar(vars.element.loContrast),
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: fallbackVar(vars.element.font),
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: rem(12),
  lineHeight: 1.25,
  textAlign: 'center',
  textWrap: 'balance',
  opacity: 0.9,
  color: fallbackVar(vars.element.loContrast),
  selectors: {
    [`${container}:hover &`]: {
      opacity: 1
    }
  }
})

export const element = style({
  position: 'relative',
  width: ['100%', '-webkit-fill-available'],
  height: ['100%', '-webkit-fill-available'],
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
      paddingTop: rem(36)
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
