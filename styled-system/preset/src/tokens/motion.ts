import { defineTokens } from '@pandacss/dev'

export const durations = defineTokens.durations({
  '0': { value: '0s' },
  fastest: { value: '80ms', description: 'instant feedback' },
  fast: { value: '120ms', description: 'hover, state changes' },
  medium: { value: '170ms', description: 'backdrops, fades' },
  slow: { value: '240ms' },
  slowest: { value: '500ms' },
})

export const easings = defineTokens.easings({
  default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  out: { value: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  inOut: { value: 'cubic-bezier(0.50, 0, 0.2, 1)' },
})

export const animations = defineTokens.animations({})
