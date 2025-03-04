import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { easings, vars, whereLight, whereNotReducedGraphics } from '../../../theme-vars'

export const varCompoundOpacity = createVar('opacity')
export const varBorderRadius = createVar('borderRadius')
export const varBorderTransparency = createVar('borderTransparency')
export const varBorderColor = createVar('border-color')
const varBorderWidth = createVar('border-width')

export const container = style({
  vars: {
    [varBorderRadius]: '6px',
    [varBorderWidth]: '3px',
  },
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  border: '0px solid transparent',
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  ':before': {
    borderRadius: varBorderRadius,
    content: ' ',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: '0px solid transparent',
    background: vars.element.fill,
    backgroundClip: 'padding-box',
  },
  selectors: {
    [`&:is([data-compound-transparent="true"])`]: {
      boxShadow: 'none',
    },
    [`&:is([data-compound-transparent="true"]):before`]: {
      opacity: varCompoundOpacity,
      borderWidth: calc(varBorderWidth).subtract('1px').toString(),
    },
    [`${whereNotReducedGraphics} &:is([data-compound-transparent="true"]):before`]: {
      transition: `all 200ms ${easings.inOut}`,
    },
    [`:where(.react-flow__node.dragging) &`]: {
      boxShadow: 'none',
    },
    [`&:is([data-likec4-dimmed="true"])`]: {
      opacity: 0.25,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
    [`&:is([data-likec4-dimmed="immediate"])`]: {
      opacity: 0.25,
      transition: 'opacity 100ms ease-in-out, filter 100ms ease-in-out',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
  },
})

globalStyle(`:where([data-mantine-color-scheme='dark'] [data-compound-transparent="true"])`, {
  vars: {
    ['--_compound-border-color']: `color-mix(in srgb, ${vars.compound.titleColor} 25%, ${vars.element.stroke})`,
  },
})
globalStyle(`:where([data-mantine-color-scheme='light'] [data-compound-transparent="true"])`, {
  vars: {
    ['--_compound-title-color']: vars.element.stroke,
  },
})

export const compoundBorder = style({
  borderRadius: varBorderRadius,
  padding: 0,
  margin: 0,
  transition: `all 250ms ${easings.inOut}`,
  cursor: 'default',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  background: 'transparent',
  borderStyle: 'dashed',
  borderWidth: varBorderWidth,
  borderColor: `color-mix(in srgb , ${varBorderColor}, transparent ${fallbackVar(varBorderTransparency, '5%')})`,
  vars: {
    [varBorderColor]: `var(--_compound-border-color,${vars.element.stroke})`,
  },
})

const indicatorKeyframes = keyframes({
  'from': {
    opacity: 0.6,
  },
  'to': {
    opacity: 0.3,
  },
})

const indicatorStroke = createVar('indicator-stroke')
const indicatorStrokeWidth = createVar('indicator-stroke-width')
export const indicator = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  overflow: 'visible',
  visibility: 'hidden',
  vars: {
    [indicatorStroke]: vars.element.loContrast,
    [indicatorStrokeWidth]: '6',
  },
  selectors: {
    ':where(.react-flow__node.selected:not(:focus-visible)) &': {
      visibility: 'visible',
    },
    ':where(.react-flow__node:focus-within:not(.selected)) &': {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.stroke} 30%, ${vars.element.loContrast})`,
        [indicatorStrokeWidth]: '8',
      },
    },
    [`${whereLight} &`]: {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.stroke} 80%, #000)`,
      },
    },
  },
})

globalStyle(`${indicator} rect`, {
  stroke: indicatorStroke,
  strokeWidth: indicatorStrokeWidth,
  fill: 'none',
})
globalStyle(`${whereNotReducedGraphics}  ${indicator} rect`, {
  transformOrigin: 'center center',
  animationDuration: '800ms',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  animationName: indicatorKeyframes,
})
