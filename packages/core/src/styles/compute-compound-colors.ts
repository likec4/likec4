import chroma from 'chroma-js'
import { map, pipe, zip } from 'remeda'
import type { NTuple } from '../types'
import { invariant } from '../utils'
import type { ElementColorValues, HexColor } from './types'

/**
 * Compute color values for compound nodes (for six depth levels)
 *
 * @param base The base element colors
 */
export function computeCompoundColorValues<Depth extends number = 6>(
  base: ElementColorValues,
  depth?: Depth,
): NTuple<ElementColorValues, Depth> {
  const d = depth ?? 6
  let fill = chroma(base.fill)
  let stroke = chroma(base.stroke)

  const isFillTooLight = fill.luminance() > 0.8

  const fills = chroma
    .scale(
      isFillTooLight
        ? [fill.darken(0.02), fill.darken(0.1)]
        : [fill.brighten(0.02), fill.brighten(.7)],
    )
    .mode('oklch')
    .correctLightness()
    .colors(d, null)

  const strokes = chroma
    .scale(
      isFillTooLight
        ? [stroke.darken(0.08), stroke.darken(0.16)]
        : [stroke.brighten(0.2), stroke.brighten(.5)],
    )
    .mode('oklch')
    .correctLightness()
    .colors(d, null)

  const colors = pipe(
    zip(fills, strokes),
    map(([fill, stroke]): ElementColorValues => ({
      ...base,
      fill: fill.hex() as HexColor,
      stroke: stroke.hex() as HexColor,
    })),
  )
  invariant(colors.length === d, `Expected ${d} colors, got ${colors.length}`)

  return colors as NTuple<ElementColorValues, Depth>
}
