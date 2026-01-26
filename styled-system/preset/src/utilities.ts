import type { Config } from '@pandacss/dev'

type ExtendableUtilityConfig = NonNullable<Config['utilities']>

const durationValues = [
  'fastest',
  'faster',
  'fast',
  'normal',
  'slow',
  'slower',
  'slowest',
  'none',
]

export const utilities: ExtendableUtilityConfig = {
  extend: {
    transition: {
      values: durationValues,
      className: 'transition',
      transform(value, { token }) {
        if (value === 'none') {
          return {
            transition: 'none',
          }
        }
        if (!durationValues.includes(value)) {
          return {
            transition: value,
          }
        }
        return {
          transition: `all ${token.raw(`durations.${value}`)!.value} ${token.raw('easings.inOut')!.value}`,
        }
      },
    },
  },
}
