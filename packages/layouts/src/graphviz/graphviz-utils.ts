

export const pointToPx = (pt: number) => Math.ceil((pt * 96) / 72)
export const inchToPx = (inch: number) => Math.ceil(inch * 96)
export const pxToInch = (px: number) => Math.round((px / 96) * 10000) / 10000
export const pxToPoints = (px: number) => px * 0.75

export const toKonvaAlign = (align: 'l' | 'r' | 'c') => {
  switch (align) {
    case 'l':
      return 'left'
    case 'r':
      return 'right'
    case 'c':
      return 'center'
  }
  // @ts-expect-error - Unexhaustive match
  throw new Error(`Invalid align: ${align}`)
}
