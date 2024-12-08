import { type ComputedNode, invariant, nonexhaustive, type Point, type RelationshipArrowType } from '@likec4/core'
import { scale, toHex, transparentize } from 'khroma'
import type { ArrowType, Color } from 'ts-graphviz'

export function isCompound(node: ComputedNode) {
  return node.children.length > 0
}

export function toArrowType(type: RelationshipArrowType): ArrowType {
  switch (type) {
    case 'open':
      return 'vee'
    default:
      return type
  }
}

// export const pointToPx = (pt: number) => Math.ceil((pt * 96 ) / 72)
// export const inchToPx = (inch: number) => Math.ceil(inch * 96)
// export const pxToInch = (px: number) => Math.ceil((px / 96) * 1000) / 1000
// export const pxToPoints = (px: number) => Math.ceil(px * 0.75 * 100) / 100

export function pointToPx(point: [number, number]): Point
export function pointToPx(pt: number): number
export function pointToPx(pt: number | [number, number]) {
  if (Array.isArray(pt)) {
    return [pointToPx(pt[0]), pointToPx(pt[1])] as const
  }
  invariant(isFinite(pt), `Invalid not finite point value ${pt}`)
  return Math.round(pt)
}
export const inchToPx = (inch: number) => {
  invariant(isFinite(inch), `Invalid not finite inch value ${inch}`)
  return Math.floor(inch * 72)
}
export const pxToInch = (px: number) => Math.ceil((px / 72) * 1000) / 1000
export const pxToPoints = (px: number) => Math.ceil(px)

export const IconSizePoints = pxToPoints(40).toString()

export function compoundColor(color: string, depth: number): Color {
  return toHex(
    scale(color, {
      l: -35 - 5 * depth,
      s: -15 - 5 * depth
    })
  ) as Color
}
export function compoundLabelColor(color: string): `#${string}` {
  return toHex(transparentize(color, 0.3)) as any
}
