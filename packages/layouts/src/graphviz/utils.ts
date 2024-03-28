import { invariant, nonexhaustive, type Point } from '@likec4/core'
import { scale, toHex, transparentize } from 'khroma'
import type { Color } from 'ts-graphviz'

// export const pointToPx = (pt: number) => Math.ceil((pt * 96 ) / 72)
// export const inchToPx = (inch: number) => Math.ceil(inch * 96)
// export const pxToInch = (px: number) => Math.ceil((px / 96) * 1000) / 1000
// export const pxToPoints = (px: number) => Math.ceil(px * 0.75 * 100) / 100

export function pointToPx(point: Point): Point
export function pointToPx(pt: number): number
export function pointToPx(pt: number | [number, number]) {
  if (Array.isArray(pt)) {
    return [pointToPx(pt[0]), pointToPx(pt[1])]
  }
  invariant(isFinite(pt), `Invalid not finite point value ${pt}`)
  return Math.ceil(pt)
}
export const inchToPx = (inch: number) => {
  invariant(isFinite(inch), `Invalid not finite inch value ${inch}`)
  return Math.ceil(inch * 72)
}
export const pxToInch = (px: number) => Math.ceil((px / 72) * 1000) / 1000
export const pxToPoints = (px: number) => Math.ceil(px)

export const IconSizePoints = pxToPoints(40).toString()

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

export function compoundColor(color: string, depth: number): Color {
  return toHex(
    scale(color, {
      l: -35 - 5 * depth,
      s: -15 - 5 * depth
    })
  ) as Color
}
export function compoundLabelColor(color: string): Color {
  return toHex(transparentize(color, 0.3)) as Color
}
