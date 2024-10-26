import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { mantine, vars } from '../../../theme-vars'

export const container = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  padding: 0,
  margin: 0,
  ':before': {
    content: ' ',
    position: 'absolute',
    top: 0,
    left: -16,
    width: 16,
    height: 'min(100%, 80px)',
    pointerEvents: 'all',
    background: 'transparent'
  }
})

export const nodeHandlerInCenter = style({
  top: '50%',
  left: '50%',
  visibility: 'hidden'
})

export const dimmed = style({})

globalStyle(`.react-flow__node-compound:has(${dimmed})`, {
  opacity: 0.25,
  transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
  transitionDelay: '200ms',
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  willChange: 'opacity, filter'
})

export const varOpacity = createVar('opacity')
export const varBorderTransparency = createVar('border-transparency')

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke
)

export const compoundBody = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: 6,
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  padding: 0,
  margin: 0,
  transition: 'all 200ms ease-out',
  backgroundClip: 'padding-box',
  overflow: 'hidden',
  cursor: 'default',
  selectors: {
    [`:where(.react-flow__node.selected) &`]: {
      boxShadow: 'none'
    },
    ':where(.react-flow__node:focus-visible) &': {
      transitionDuration: '0ms',
      outline: `3px solid ${outlineColor}`,
      outlineOffset: rem(1.5)
    }
  },
  ':before': {
    content: ' ',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    transition: 'background 175ms ease-out, opacity 175ms ease-out',
    background: vars.element.fill
  }
})

const opacityDeltaOnHover = createVar('opacityDeltaOnHover')
export const transparent = style({
  borderStyle: 'dashed',
  borderWidth: 3,
  boxShadow: 'none',
  borderColor: `color-mix(in srgb , ${vars.element.stroke}, transparent ${fallbackVar(varBorderTransparency, '10%')})`,
  vars: {
    [opacityDeltaOnHover]: '0',
    '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`
  },
  ':before': {
    borderRadius: 'unset',
    transitionDelay: '100ms',
    opacity: calc.add(fallbackVar(varOpacity, '1'), opacityDeltaOnHover)
  },
  selectors: {
    // [`:where(.react-flow__node.selected) &`]: {
    //   vars: {
    //     [opacityDeltaOnHover]: '.05'
    //   }
    // },
    [`:where([data-hovered]) &`]: {
      vars: {
        [opacityDeltaOnHover]: '.08'
      }
    }
  }
})

export const title = style({
  fontFamily: vars.compound.font,
  textAlign: 'left',
  fontWeight: 600,
  fontSize: rem(15),
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  lineHeight: 1,
  color: `var(--_compound-title-color,${vars.compound.titleColor})`,
  paddingLeft: 14,
  paddingTop: 13,
  paddingBottom: 6,
  minHeight: 30,
  mixBlendMode: 'screen',
  selectors: {
    [`:where(.react-flow__node.draggable) &`]: {
      cursor: 'grab'
    },
    [`:where(.likec4-compound-transparent) &`]: {
      paddingTop: 10
    }
  }
})
export const titleWithNavigation = style({
  paddingLeft: 32
})

globalStyle(`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent)`, {
  vars: {
    ['--_compound-title-color']: vars.element.stroke
  }
})

const indicatorKeyframes = keyframes({
  'from': {
    opacity: 0.6
  },
  'to': {
    opacity: 0.3
  }
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
    [indicatorStrokeWidth]: '6'
  },
  selectors: {
    ':where(.react-flow__node.selected:not(:focus-visible)) &': {
      visibility: 'visible'
    },
    ':where(.react-flow__node:focus-within:not(.selected)) &': {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.stroke} 30%, ${vars.element.loContrast})`,
        [indicatorStrokeWidth]: '8'
      }
    },
    [`:where([data-mantine-color-scheme='light']) &`]: {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.stroke} 80%, #000)`
      }
    }
  }
})

globalStyle(`${indicator} rect`, {
  stroke: indicatorStroke,
  transformOrigin: 'center center',
  strokeWidth: indicatorStrokeWidth,
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  fill: 'none'
})

const navigateBtnColor = createVar('navigateBtnColor')

globalStyle(`${container}`, {
  vars: {
    [navigateBtnColor]: vars.element.loContrast
  }
})
globalStyle(`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent)`, {
  vars: {
    [navigateBtnColor]: vars.element.stroke
  }
})

export const navigateBtn = style({
  position: 'absolute',
  pointerEvents: 'all',
  left: 3,
  top: 6,
  cursor: 'pointer',
  color: `var(--_compound-title-color,${navigateBtnColor})`,
  opacity: 'var(--ai-opacity)',
  backgroundColor: 'var(--ai-bg)',
  vars: {
    '--ai-opacity': '0.75',
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`
  },
  ':hover': {
    boxShadow: mantine.shadows.md
  },
  selectors: {
    [`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent) &`]: {
      opacity: 0.85,
      vars: {
        '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 60%)`,
        '--ai-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 20%)`
      }
    }
  }
})
