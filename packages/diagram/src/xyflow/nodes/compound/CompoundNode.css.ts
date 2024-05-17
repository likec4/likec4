import { rem } from '@mantine/core'
import { createVar, fallbackVar, generateIdentifier, globalKeyframes, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../mantine.css'
import { vars } from '../../../theme.css'

export const cssContainer = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  padding: 0,
  margin: 0
})

const bgTransparency = createVar('bgTransparency')

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke
)

export const cssCompound = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: rem(6),
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  padding: rem(8),
  background: vars.element.fill,
  transition: 'all 300ms ease-out',
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

// @ts-ignore
const cssTransparentCompound = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: rem(8),
  borderStyle: 'dashed',
  borderWidth: rem(3.5),
  borderColor: vars.element.fill,
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.05) , 0 2px 2px -1px rgba(0,0,0,0.04)',
  padding: rem(8),
  background: `color-mix(in srgb , ${vars.element.fill},  transparent ${bgTransparency})`,
  transition: 'all 200ms ease-out',
  vars: {
    [bgTransparency]: '90%'
  },
  selectors: {
    [`:where(${cssContainer}[data-hovered]) &`]: {
      transitionDelay: '300ms',
      vars: {
        [bgTransparency]: '65%'
      }
    },
    [`:where(.react-flow__node.selected) &`]: {
      transitionDelay: '50ms',
      boxShadow: 'none',
      borderColor: 'transparent',
      vars: {
        [bgTransparency]: '15%'
      }
    }
  }
})

export const cssTitle = style({
  fontFamily: vars.compound.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: 'left',
  display: 'inline-block',
  fontWeight: 600,
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  lineHeight: 1,
  opacity: 0.75,
  color: vars.compound.titleColor,
  paddingLeft: rem(12),
  mixBlendMode: 'lighten',
  selectors: {
    [`:where([data-likec4-navigable='true']) &`]: {
      paddingLeft: rem(26)
    }
  }
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

export const cssIndicator = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  overflow: 'visible',
  visibility: 'hidden',
  selectors: {
    ':where(.react-flow__node.selected:not(:focus-visible)) &': {
      visibility: 'visible'
    }
  }
})

globalStyle(`${cssIndicator} rect`, {
  stroke: vars.element.loContrast,
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  fill: 'none'
})

globalStyle(`:where(.react-flow__node:focus-within:not(.selected)) ${cssIndicator} rect`, {
  stroke: `color-mix(in srgb, ${vars.element.stroke} 30%, ${vars.element.loContrast})`,
  strokeWidth: 8
})

export const cssNavigateBtn = style({
  position: 'absolute',
  pointerEvents: 'all',
  left: 3,
  top: 7,
  cursor: 'pointer',
  color: vars.element.loContrast,
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
    [`:where(.react-flow__node:not(.dragging) ${cssContainer}:hover) &:not(:hover)`]: {
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
globalStyle(`${cssNavigateBtn} svg.icon`, {
  width: '70%',
  height: '70%',
  strokeWidth: 1.5
})

// globalStyle(`:where(.react-flow__node:not(.dragging)) ${cssIndicator}`, {
//   visibility: 'visible',
//   ":hover": {
//   }
// })
