import { type Config, defineUtility } from '@pandacss/dev'

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

export const utilities = {
  extend: {
    transition: defineUtility({
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
          transitionDuration: token(`durations.${value}`),
          transitionTimingFunction: token('easings.inOut'),
        }
      },
    }),
  },
}
