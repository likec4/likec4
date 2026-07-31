import type { XYPoint } from '../geometry'
import type { StorySceneLayout } from '../types/view-parsed.story'

const ZERO: XYPoint = { x: 0, y: 0 }

function centroid(points: readonly XYPoint[]): XYPoint {
  let x = 0
  let y = 0
  for (const p of points) {
    x += p.x
    y += p.y
  }
  return { x: x / points.length, y: y / points.length }
}

/**
 * Computes the translation to apply to an incoming story scene so that elements
 * present in both the outgoing and incoming scenes move as little as possible.
 *
 * Translation only — no scale, no rotation. Scaling would render the same element
 * at different sizes in different scenes, which reads as a zoom rather than as
 * continuity; rotation has no natural anchor for arbitrary layouts. Restricting
 * the fit to a translation keeps the transition legible: the eye tracks a shared
 * element by its motion, not by a change in its apparent size or angle.
 *
 * Centroid alignment is the least-squares optimum for a translation-only fit
 * (the offset that minimises the sum of squared displacements of shared
 * elements is exactly the difference of centroids), so it degrades predictably
 * as the shared set changes: with one shared element it pins that element
 * exactly; with several, it minimises their mean displacement rather than
 * favouring any one of them.
 *
 * When the two scenes share no elements there is nothing to align, so the
 * offset is zero and the transition reads as a plain crossfade instead of an
 * arbitrary jump.
 *
 * `independent` mode forces a zero offset regardless of overlap, so scenes are
 * shown exactly as laid out. This exists so `anchored` and `independent` can be
 * compared side by side — `independent` is simply `anchored` with the alignment
 * subtracted out.
 *
 * `unified` mode is not implemented in this proof of concept and currently
 * behaves like `independent` (zero offset).
 *
 * @param outgoing positions of the scene currently on screen, keyed by node id
 * @param incoming positions from the incoming scene's own layout, keyed by node id
 * @param mode alignment strategy; only `anchored` computes a non-zero offset
 * @returns the offset to add to every incoming position, rounded to whole pixels
 */
export function calcSceneOffset(
  outgoing: ReadonlyMap<string, XYPoint>,
  incoming: ReadonlyMap<string, XYPoint>,
  mode: StorySceneLayout,
): XYPoint {
  if (mode !== 'anchored') {
    return ZERO
  }

  const from: XYPoint[] = []
  const to: XYPoint[] = []
  for (const [id, target] of incoming) {
    const source = outgoing.get(id)
    if (source) {
      from.push(source)
      to.push(target)
    }
  }

  if (from.length === 0) {
    return ZERO
  }

  const a = centroid(from)
  const b = centroid(to)
  return {
    x: Math.round(a.x - b.x),
    y: Math.round(a.y - b.y),
  }
}
