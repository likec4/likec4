import { nonexhaustive } from '@likec4/core'

// export const pointToPx = (pt: number) => Math.ceil((pt * 96 ) / 72)
// export const inchToPx = (inch: number) => Math.ceil(inch * 96)
// export const pxToInch = (px: number) => Math.ceil((px / 96) * 1000) / 1000
// export const pxToPoints = (px: number) => Math.ceil(px * 0.75 * 100) / 100

export const pointToPx = (pt: number) => Math.ceil(pt)
export const inchToPx = (inch: number) => Math.ceil(inch * 72)
export const pxToInch = (px: number) => Math.ceil((px / 72) * 1000) / 1000
export const pxToPoints = (px: number) => Math.ceil(px)

export const IconSize = '30'
export const IconSizePoints = pxToPoints(30).toString()

export const toKonvaAlign = (align: 'l' | 'r' | 'c') => {
  switch (align) {
    case 'l':
      return 'left'
    case 'r':
      return 'right'
    case 'c':
      return 'center'
  }
  // @ts-expect-error - Non-exhaustive switch statement
  nonexhaustive(`Invalid align: ${align}`)
}
