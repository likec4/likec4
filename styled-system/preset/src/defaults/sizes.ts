import type { Size } from './types'

export const defaultSizes = {
  sizes: {
    xs: {
      width: 180,
      height: 100,
    },
    sm: {
      width: 240,
      height: 135,
    },
    md: {
      width: 320,
      height: 180,
    },
    lg: {
      width: 420,
      height: 234,
    },
    xl: {
      width: 520,
      height: 290,
    },
  },
  spacing: {
    xs: 8, // 0.5rem
    sm: 10, // 0.625rem
    md: 16, // 1rem
    lg: 24, // 1.5rem = 16px + 8px
    xl: 32, // 2rem
  },
  /**
   * Text sizes for titles
   * https://typescale.com/
   *
   * Scale:  1.2
   * Base:   16px
   */
  textSizes: {
    xs: 13.33,
    sm: 16,
    md: 19.2,
    lg: 23.04,
    xl: 27.65,
  },
  iconSizes: {
    xs: 24,
    sm: 36,
    md: 60,
    lg: 82,
    xl: 90,
  },
} as const satisfies Record<string, Record<Size, any>>
