import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { easings, mantine, transitions, vars, whereLight } from '../../../theme-vars'

export const varCompoundOpacity = createVar('opacity')
export const varBorderRadius = createVar('borderRadius')
export const varBorderTransparency = createVar('borderTransparency')
export const varBorderColor = createVar('border-color')

export const dimmed = style({})
globalStyle(`.react-flow__node:has(${dimmed})`, {
  opacity: 0.25,
  transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
  transitionDelay: '200ms',
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  willChange: 'opacity, filter',
})

export const container = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  border: '0px solid transparent',
  vars: {
    [varBorderRadius]: '6px',
  },
})

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke,
)

export const compoundBg = style({
  borderRadius: varBorderRadius,
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  padding: 0,
  margin: 0,
  transition: `all 220ms ${easings.inOut}`,
  // backgroundClip: 'padding-box',
  // overflow: 'hidden',
  cursor: 'default',
  selectors: {
    [`:where(.react-flow__node.dragging) &`]: {
      boxShadow: 'none',
    },
    ':where(.react-flow__node:focus-visible) &': {
      transitionDuration: '0ms',
      outline: `3px solid ${outlineColor}`,
      outlineOffset: rem(1.5),
    },
  },
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  border: '0px solid transparent',
  background: vars.element.fill,
  backgroundClip: 'border-box',
})
globalStyle(`:where([data-compound-transparent="true"]) ${compoundBg}`, {
  opacity: varCompoundOpacity,
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
  transition: transitions.fast,
  cursor: 'default',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  background: 'transparent',
  borderStyle: 'dashed',
  borderWidth: 3,
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
  transformOrigin: 'center center',
  strokeWidth: indicatorStrokeWidth,
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  fill: 'none',
})
