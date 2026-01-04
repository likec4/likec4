import { defineAnimationStyles, defineKeyframes } from '@pandacss/dev'
import type { AnimationStyles, CssKeyframes } from '@pandacss/types'

export const keyframes: CssKeyframes = defineKeyframes({
  'indicatorOpacity': {
    '0%': {
      opacity: 0.8,
    },
    '100%': {
      opacity: 0.3,
    },
  },
  'xyedgeAnimated': {
    '0%': {
      strokeDashoffset: 36, // dash array (10,8)*2
    },
    '100%': {
      strokeDashoffset: 0,
    },
  },
})

export const animationStyles: AnimationStyles = defineAnimationStyles({
  'indicator': {
    value: {
      animationDuration: '.8s',
      animationIterationCount: 'infinite',
      animationDirection: 'alternate',
      animationName: 'indicatorOpacity',
      animationTimingFunction: '{easings.in}',
    },
  },
  'xyedgeAnimated': {
    value: {
      animationDuration: '800ms',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
      animationFillMode: 'both',
      animationName: 'xyedgeAnimated',
    },
  },
})
