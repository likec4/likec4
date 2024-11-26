import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { mantine, vars, whereLight } from '../../../theme-vars'

// For framer motion
export const containerForFramer = style({
  position: 'relative',
  width: '100%',
  height: '100%'
  // transformOrigin: 'center center'
})

const iconSize = createVar('icon-size')
export const container = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  padding: 0,
  margin: 0,
  vars: {
    [iconSize]: '18px'
  },
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

globalStyle(`:where([data-mantine-color-scheme='dark'] .likec4-compound-transparent)`, {
  vars: {
    ['--_compound-border-color']: `color-mix(in srgb, ${vars.compound.titleColor} 25%, ${vars.element.stroke})`
  }
})
globalStyle(`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent)`, {
  vars: {
    ['--_compound-title-color']: vars.element.stroke
  }
})

export const varOpacity = createVar('opacity')
export const varBorderColor = createVar('border-color')
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
  // overflow: 'hidden',
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
export const compoundTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  paddingLeft: 14,
  paddingTop: 9,
  minHeight: 30,
  selectors: {
    [`:where(.react-flow__node.draggable) &`]: {
      cursor: 'grab'
    },
    [`:where(.likec4-compound-transparent) &`]: {
      paddingTop: 4
    }
  }
})
export const withNavigation = style({
  paddingLeft: 30
})

const opacityDeltaOnHover = createVar('opacityDeltaOnHover')
export const transparent = style({
  borderStyle: 'dashed',
  borderWidth: 3,
  boxShadow: 'none',
  borderColor: `color-mix(in srgb , ${varBorderColor}, transparent ${fallbackVar(varBorderTransparency, '5%')})`,
  vars: {
    [varBorderColor]: `var(--_compound-border-color,${vars.element.stroke})`,
    [opacityDeltaOnHover]: '0'
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
  flex: 1,
  fontFamily: vars.compound.font,
  fontWeight: 600,
  fontSize: rem(15),
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  // lineHeight: 1,
  color: `var(--_compound-title-color,${vars.compound.titleColor})`,
  // paddingLeft: 0,
  // paddingTop: 13,
  // paddingBottom: 6,
  // minHeight: 20,
  mixBlendMode: 'screen'
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

const btn = style({
  pointerEvents: 'all',
  cursor: 'pointer',
  color: `var(--_compound-title-color,${navigateBtnColor})`,
  opacity: 'var(--ai-opacity)',
  backgroundColor: 'var(--ai-bg)',
  vars: {
    '--ai-opacity': '1',
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`
  },
  ':hover': {
    boxShadow: mantine.shadows.md
  },
  selectors: {
    [`${whereLight} .likec4-compound-transparent &`]: {
      opacity: 0.85,
      vars: {
        '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 20%)`,
        '--ai-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
        '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`
      }
    }
  }
})

export const navigateBtn = style([btn, {
  position: 'absolute',
  left: 3,
  top: 6
}])

export const detailsBtn = style([btn, {
  // position: 'absolute',
  // top: 2,
  // right: 2,
  // selectors: {
  //   [`:where([data-likec4-shape='browser']) &`]: {
  //     top: 3,
  //     right: 5
  //   },
  //   ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
  //     top: 14
  //   },
  //   ':where([data-likec4-shape="queue"]) &': {
  //     top: 1,
  //     right: 12
  //   }
  // }
}])

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'luminosity'
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
  `
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain'
})
