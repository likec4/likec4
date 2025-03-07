import { defaultTheme } from '@likec4/core'
import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { easings, vars, whereReducedGraphics } from '../../../theme-vars'
import { iconSize, paddingSize, textSize } from './vars.css'

export const stokeFillMix = createVar('stroke-fill-mix')

export const container = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`,
  },
  ':after': {
    content: ' ',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 24,
    background: 'transparent',
    pointerEvents: 'all',
  },

  selectors: {
    [`&:is([data-likec4-dimmed="true"])`]: {
      opacity: 0.25,
      transition: `opacity 400ms ${easings.inOut}, filter 500ms ${easings.inOut}`,
      transitionDelay: '50ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
    },
    [`&:is([data-likec4-dimmed="immediate"])`]: {
      opacity: 0.25,
      transition: `opacity 100ms ${easings.inOut}, filter 100ms ${easings.inOut}`,
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
    },
    [`${whereReducedGraphics}  &:after`]: {
      display: 'none',
    },
    [`:where(.react-flow__node.selectable:not(.dragging)) &`]: {
      cursor: 'pointer',
    },
  },
})

globalStyle(`${container}`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.md),
    [paddingSize]: rem(defaultTheme.spacing.md),
    [iconSize]: '60px',
  },
})

globalStyle(`${container}[data-likec4-shape-size="xs"]`, {
  vars: {
    [iconSize]: '24px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="sm"]`, {
  vars: {
    [iconSize]: '36px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="lg"]`, {
  vars: {
    [iconSize]: '82px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="xl"]`, {
  vars: {
    [iconSize]: '90px',
  },
})

const sizes = ['xs', 'sm', 'lg', 'xl'] as const
sizes.forEach((size) => {
  globalStyle(`${container}[data-likec4-text-size="${size}"]`, {
    vars: {
      [textSize]: rem(defaultTheme.textSizes[size]),
    },
  })

  globalStyle(`${container}[data-likec4-padding="${size}"]`, {
    vars: {
      [paddingSize]: rem(defaultTheme.spacing[size]),
    },
  })
})
