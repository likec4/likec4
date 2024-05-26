import { rem } from '@mantine/core'
import { createVar, fallbackVar, generateIdentifier, globalKeyframes, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../mantine.css'
import { vars } from '../../../theme.css'

export const container = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  padding: 0,
  margin: 0
})

export const varTransparency = createVar('transparency')

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
  padding: 8,
  background: vars.element.fill,
  transition: 'all 200ms ease-out',
  selectors: {
    [`:where(.react-flow__node.selected) &`]: {
      boxShadow: 'none'
    },
    ':where(.react-flow__node:focus-visible) &': {
      transitionDuration: '0ms',
      outline: `3px solid ${outlineColor}`,
      outlineOffset: rem(1.5)
    }
  }
})

const bgTransparency = createVar('bgTransparency')
const bgTransparencyDelta = createVar('bgTransparencyDelta')
export const transparent = style({
  borderStyle: 'dashed',
  borderWidth: 3,
  padding: 6,
  borderColor: `color-mix(in srgb , ${vars.element.stroke},  transparent min(${bgTransparency}, 30%))`,
  background: `color-mix(in srgb , ${vars.element.fill},  transparent ${bgTransparency})`,
  backgroundClip: 'padding-box',
  // transitionTimingFunction: 'ease-in',
  // transition: 'all 150ms ease-in-out',
  vars: {
    [bgTransparency]: `calc(${fallbackVar(varTransparency, '80%')} - ${bgTransparencyDelta})`,
    [bgTransparencyDelta]: '0%',
    '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`
  },
  selectors: {
    [`:where(.react-flow__node.selected) &`]: {
      transitionDelay: '50ms',
      // borderColor: 'transparent',
      // transitionTimingFunction: 'ease-out',
      vars: {
        [bgTransparencyDelta]: '5%'
      }
    },
    [`:where([data-hovered]) &`]: {
      transitionDelay: '175ms',
      // transitionTimingFunction: 'ease-out',
      vars: {
        [bgTransparencyDelta]: '15%'
      }
    },

  }
})

export const title = style({
  fontFamily: vars.compound.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: 'left',
  display: 'inline-block',
  fontWeight: 600,
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  lineHeight: 1,
  opacity: 0.75,
  color: `var(--_compound-title-color,${vars.compound.titleColor})`,
  paddingLeft: 12,
  selectors: {
    [`:where([data-likec4-navigable='true']) &`]: {
      paddingLeft: 26
    }
    // [`:where([data-mantine-color-scheme='light']) &`]: {
    //   opacity: 1
    // }
  }
})

globalStyle(`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent)`, {
  vars: {
    ['--_compound-title-color']: vars.element.stroke
  }
})

globalStyle(`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent) ${title}`, {
  opacity: 1
})

const indicatorKeyframes = generateIdentifier('indicator')
globalKeyframes(indicatorKeyframes, {
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

// globalStyle(`:where(.react-flow__node:focus-within:not(.selected)) ${indicator} rect`, {
//   stroke: `color-mix(in srgb, ${vars.element.stroke} 30%, ${vars.element.loContrast})`,
//   strokeWidth: 8
// })
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
  top: 7,
  cursor: 'pointer',
  color: `var(--_compound-title-color,${navigateBtnColor})`,
  transformOrigin: '90% 70%',
  opacity: 0.75,
  transition: 'all 150ms ease-out',
  transitionDelay: '0ms',
  backgroundColor: 'var(--ai-bg)',
  vars: {
    '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`
  },
  ':hover': {
    boxShadow: mantine.shadows.lg,
    transform: 'scale(1.466)',
    opacity: 1,
    transitionDelay: '0'
  },
  ':active': {
    transform: 'scale(1.1)',
    opacity: 1,
    transitionDelay: '0'
  },
  selectors: {
    [`:where([data-mantine-color-scheme='light'] .likec4-compound-transparent) &`]: {
      opacity: 0.85,
      vars: {
        '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 50%)`,
        '--ai-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 20%)`
      }
    },
    [`:where(.react-flow__node:not(.dragging) ${container}:hover) &:not(:hover)`]: {
      boxShadow: mantine.shadows.lg,
      transform: 'scale(1.223)',
      opacity: 1,
      transitionDelay: '250ms',
      vars: {
        '--ai-bg': 'var(--ai-bg-hover)'
      }
    }
  }
})
globalStyle(`${navigateBtn} svg.icon`, {
  width: '70%',
  height: '70%',
  strokeWidth: 1.5
})

// globalStyle(`:where(.react-flow__node:not(.dragging)) ${cssIndicator}`, {
//   visibility: 'visible',
//   ":hover": {
//   }
// })
