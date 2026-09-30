import type { BBox, XYPoint } from '@likec4/core/geometry'

export const NOTE_CARD_WIDTH = 240
export const NOTE_CARD_GAP = 24
export const NOTE_TARGET_DOT_RADIUS = 3

export interface NoteCardSize {
  width: number
  height: number
}

export interface NodeNoteTarget {
  id: string
  kind: 'node'
  bounds: BBox
  size: NoteCardSize
}

export interface EdgeNoteTarget {
  id: string
  kind: 'edge'
  /** Midpoint of the rendered edge path, in diagram coordinates. */
  anchor: XYPoint
  /** Direction of the rendered edge path at its midpoint. */
  tangent?: XYPoint
  size: NoteCardSize
}

export type NoteTarget = NodeNoteTarget | EdgeNoteTarget

export interface NoteObstacle {
  bounds: BBox
  /** The target's own body is not an obstacle for its card. */
  ownerId?: string
}

/** Keep cards off a compound's heading and visible border while leaving its interior free. */
export function compoundFrameObstacles(bounds: BBox, ownerId: string): NoteObstacle[] {
  const headerHeight = Math.min(bounds.height, 40)
  const border = 4
  const sideHeight = Math.max(0, bounds.height - headerHeight)
  return [
    { bounds: { ...bounds, height: headerHeight }, ownerId },
    { bounds: { x: bounds.x, y: bounds.y + headerHeight, width: border, height: sideHeight }, ownerId },
    {
      bounds: {
        x: bounds.x + bounds.width - border,
        y: bounds.y + headerHeight,
        width: border,
        height: sideHeight,
      },
      ownerId,
    },
    {
      bounds: {
        x: bounds.x,
        y: bounds.y + bounds.height - border,
        width: bounds.width,
        height: border,
      },
      ownerId,
    },
  ]
}

export interface NoteSegment {
  from: XYPoint
  to: XYPoint
  /** The target edge itself is not counted as a leader crossing. */
  ownerId?: string
}

export interface NotePlacement {
  id: string
  kind: NoteTarget['kind']
  bounds: BBox
  /** Straight leader from the card boundary to the target boundary or path midpoint. */
  leader: NoteSegment
}

export interface NotePlacementInput {
  architectureBounds: BBox
  targets: readonly NoteTarget[]
  /** Interactive bodies and edge labels; omit free compound interiors. */
  obstacles: readonly NoteObstacle[]
  /** Rendered edge path segments. */
  segments: readonly NoteSegment[]
}

export interface NotePlacementResult {
  placements: NotePlacement[]
  bounds: BBox
}

const diagonalGap = NOTE_CARD_GAP / Math.SQRT2

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value))
}

/** Nearest point on a card boundary, including when the target lies inside the card. */
function nearestBoundaryPoint(box: BBox, point: XYPoint): XYPoint {
  const x = clamp(point.x, box.x, box.x + box.width)
  const y = clamp(point.y, box.y, box.y + box.height)
  if (x !== point.x || y !== point.y) {
    return { x, y }
  }
  const distances = [
    { distance: point.x - box.x, point: { x: box.x, y } },
    { distance: box.x + box.width - point.x, point: { x: box.x + box.width, y } },
    { distance: point.y - box.y, point: { x, y: box.y } },
    { distance: box.y + box.height - point.y, point: { x, y: box.y + box.height } },
  ]
  return distances.reduce((best, next) => next.distance < best.distance ? next : best).point
}

function nodeCandidates(target: NodeNoteTarget): NotePlacement[] {
  const { x, y, width, height } = target.bounds
  const { width: cardWidth, height: cardHeight } = target.size
  const right = x + width
  const bottom = y + height
  const midX = x + width / 2
  const midY = y + height / 2
  const candidates: { x: number; y: number; anchor: XYPoint }[] = [
    { x: right + NOTE_CARD_GAP, y: midY - cardHeight / 2, anchor: { x: right, y: midY } },
    { x: right + diagonalGap, y: bottom + diagonalGap, anchor: { x: right, y: bottom } },
    { x: midX - cardWidth / 2, y: bottom + NOTE_CARD_GAP, anchor: { x: midX, y: bottom } },
    { x: x - diagonalGap - cardWidth, y: bottom + diagonalGap, anchor: { x, y: bottom } },
    { x: x - NOTE_CARD_GAP - cardWidth, y: midY - cardHeight / 2, anchor: { x, y: midY } },
    { x: x - diagonalGap - cardWidth, y: y - diagonalGap - cardHeight, anchor: { x, y } },
    { x: midX - cardWidth / 2, y: y - NOTE_CARD_GAP - cardHeight, anchor: { x: midX, y } },
    { x: right + diagonalGap, y: y - diagonalGap - cardHeight, anchor: { x: right, y } },
    { x: right + NOTE_CARD_GAP * 2, y: midY - cardHeight / 2, anchor: { x: right, y: midY } },
    { x: midX - cardWidth / 2, y: bottom + NOTE_CARD_GAP * 2, anchor: { x: midX, y: bottom } },
    { x: x - NOTE_CARD_GAP * 2 - cardWidth, y: midY - cardHeight / 2, anchor: { x, y: midY } },
    { x: midX - cardWidth / 2, y: y - NOTE_CARD_GAP * 2 - cardHeight, anchor: { x: midX, y } },
  ]
  return candidates.map(({ x, y, anchor }) => {
    const bounds = { x, y, width: cardWidth, height: cardHeight }
    return {
      id: target.id,
      kind: target.kind,
      bounds,
      leader: { from: nearestBoundaryPoint(bounds, anchor), to: anchor },
    }
  })
}

/** Place the nearest card boundary one gap away along the direction. */
function edgeCandidate(target: EdgeNoteTarget, direction: XYPoint, gap = NOTE_CARD_GAP): NotePlacement {
  const { anchor, size } = target
  const length = Math.hypot(direction.x, direction.y)
  const nx = direction.x / length
  const ny = direction.y / length
  const bounds = {
    x: anchor.x + nx * gap + (Math.sign(nx) - 1) * size.width / 2,
    y: anchor.y + ny * gap + (Math.sign(ny) - 1) * size.height / 2,
    width: size.width,
    height: size.height,
  }
  return {
    id: target.id,
    kind: target.kind,
    bounds,
    leader: { from: nearestBoundaryPoint(bounds, anchor), to: anchor },
  }
}

function edgeCandidates(target: EdgeNoteTarget): NotePlacement[] {
  const tangent = target.tangent
  const tangentLength = tangent ? Math.hypot(tangent.x, tangent.y) : 0
  const normal = tangentLength > 1e-9
    ? { x: -tangent!.y / tangentLength, y: tangent!.x / tangentLength }
    : { x: 1, y: 0 }
  const directions = [
    normal,
    { x: -normal.x, y: -normal.y },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
  ]
  const candidates = directions.map(direction => edgeCandidate(target, direction))
  // If both sides of the edge are occupied, move the card farther along the normal.
  for (const direction of directions.slice(0, 2)) {
    for (const gap of [NOTE_CARD_GAP + target.size.height / 2, NOTE_CARD_GAP + target.size.height]) {
      const centered = edgeCandidate(target, direction, gap)
      candidates.push(centered)
      const slide = target.size.width / 4
      const slideAxis = { x: -direction.y, y: direction.x }
      for (const side of [-1, 1]) {
        const bounds = {
          ...centered.bounds,
          x: centered.bounds.x + slideAxis.x * slide * side,
          y: centered.bounds.y + slideAxis.y * slide * side,
        }
        candidates.push({
          ...centered,
          bounds,
          leader: { from: nearestBoundaryPoint(bounds, target.anchor), to: target.anchor },
        })
      }
    }
  }
  return candidates
}

function overlapArea(a: BBox, b: BBox): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

function cross(a: XYPoint, b: XYPoint, c: XYPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/** Proper intersections and collinear overlap count; shared endpoints do not. */
function segmentsCross(a: NoteSegment, b: NoteSegment): boolean {
  if (
    Math.max(a.from.x, a.to.x) < Math.min(b.from.x, b.to.x) ||
    Math.max(b.from.x, b.to.x) < Math.min(a.from.x, a.to.x) ||
    Math.max(a.from.y, a.to.y) < Math.min(b.from.y, b.to.y) ||
    Math.max(b.from.y, b.to.y) < Math.min(a.from.y, a.to.y)
  ) return false
  const ab1 = cross(a.from, a.to, b.from)
  const ab2 = cross(a.from, a.to, b.to)
  const ba1 = cross(b.from, b.to, a.from)
  const ba2 = cross(b.from, b.to, a.to)
  const epsilon = 1e-9
  if (Math.abs(ab1) < epsilon && Math.abs(ab2) < epsilon) {
    const axis = Math.abs(a.to.x - a.from.x) >= Math.abs(a.to.y - a.from.y) ? 'x' : 'y'
    const aMin = Math.min(a.from[axis], a.to[axis])
    const aMax = Math.max(a.from[axis], a.to[axis])
    const bMin = Math.min(b.from[axis], b.to[axis])
    const bMax = Math.max(b.from[axis], b.to[axis])
    return Math.min(aMax, bMax) - Math.max(aMin, bMin) > epsilon
  }
  return ab1 * ab2 < -epsilon && ba1 * ba2 < -epsilon
}

/** Length hidden behind a box; touching the box boundary does not hide a line. */
function coveredLength(segment: NoteSegment, box: BBox): number {
  if (
    Math.max(segment.from.x, segment.to.x) <= box.x ||
    Math.min(segment.from.x, segment.to.x) >= box.x + box.width ||
    Math.max(segment.from.y, segment.to.y) <= box.y ||
    Math.min(segment.from.y, segment.to.y) >= box.y + box.height
  ) return 0
  let start = 0
  let end = 1
  for (const [axis, extent] of [['x', 'width'], ['y', 'height']] as const) {
    const delta = segment.to[axis] - segment.from[axis]
    const lower = box[axis] + 1e-6
    const upper = box[axis] + box[extent] - 1e-6
    if (lower >= upper) return 0
    if (Math.abs(delta) < 1e-9) {
      if (segment.from[axis] <= lower || segment.from[axis] >= upper) return 0
    } else {
      const a = (lower - segment.from[axis]) / delta
      const b = (upper - segment.from[axis]) / delta
      start = Math.max(start, Math.min(a, b))
      end = Math.min(end, Math.max(a, b))
      if (end <= start) return 0
    }
  }
  return (end - start) * Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y)
}

type CandidateScore = [overlap: number, occlusion: number, crossings: number, leaderLength: number]

function score(
  candidate: NotePlacement,
  targetId: string,
  obstacles: readonly NoteObstacle[],
  segments: readonly NoteSegment[],
  placed: readonly NotePlacement[],
  best?: CandidateScore,
): CandidateScore {
  let overlap = 0
  for (const obstacle of obstacles) {
    if (obstacle.ownerId !== targetId) {
      overlap += overlapArea(candidate.bounds, obstacle.bounds)
    }
  }
  for (const card of placed) {
    overlap += overlapArea(candidate.bounds, card.bounds)
  }
  if (best && overlap > best[0] + 1e-6) return [overlap, Infinity, Infinity, Infinity]
  let occlusion = 0
  for (const obstacle of obstacles) {
    if (obstacle.ownerId !== targetId) occlusion += coveredLength(candidate.leader, obstacle.bounds)
  }
  for (const card of placed) {
    occlusion += coveredLength(candidate.leader, card.bounds)
    occlusion += coveredLength(card.leader, candidate.bounds)
  }
  for (const segment of segments) {
    occlusion += coveredLength(segment, candidate.bounds)
  }
  if (best && Math.abs(overlap - best[0]) < 1e-6 && occlusion > best[1] + 1e-6) {
    return [overlap, occlusion, Infinity, Infinity]
  }
  let crossings = 0
  for (const segment of segments) {
    if (segment.ownerId !== targetId && segmentsCross(candidate.leader, segment)) {
      crossings++
    }
  }
  for (const card of placed) {
    if (segmentsCross(candidate.leader, card.leader)) {
      crossings++
    }
  }
  return [
    overlap,
    occlusion,
    crossings,
    Math.hypot(candidate.leader.to.x - candidate.leader.from.x, candidate.leader.to.y - candidate.leader.from.y),
  ]
}

function better(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i]! < b[i]! - 1e-6) return true
    if (a[i]! > b[i]! + 1e-6) return false
  }
  return false
}

/** Move a blocked card outward until it clears bodies, cards, and target dots. */
function nudgeClear(
  candidate: NotePlacement,
  obstacles: readonly NoteObstacle[],
  placed: readonly NotePlacement[],
  maxOffset = Math.max(candidate.bounds.width, candidate.bounds.height),
): NotePlacement | null {
  const { from, to } = candidate.leader
  const length = Math.hypot(from.x - to.x, from.y - to.y)
  if (length < 1e-9) return null
  const direction = { x: (from.x - to.x) / length, y: (from.y - to.y) / length }
  const blockers = [
    ...obstacles.filter(obstacle => obstacle.ownerId !== candidate.id).map(obstacle => obstacle.bounds),
    ...placed.map(card => card.bounds),
  ]
  let moved = 0
  const bounds = { ...candidate.bounds }
  for (let attempt = 0; attempt <= blockers.length; attempt++) {
    const overlapping = blockers.filter(blocker => overlapArea(bounds, blocker) > 0)
    if (overlapping.length === 0) {
      return {
        ...candidate,
        bounds,
        leader: { from: nearestBoundaryPoint(bounds, to), to },
      }
    }
    let step = 0
    for (const blocker of overlapping) {
      const exits: number[] = []
      if (direction.x > 1e-9) exits.push((blocker.x + blocker.width - bounds.x) / direction.x)
      if (direction.x < -1e-9) exits.push((blocker.x - bounds.x - bounds.width) / direction.x)
      if (direction.y > 1e-9) exits.push((blocker.y + blocker.height - bounds.y) / direction.y)
      if (direction.y < -1e-9) exits.push((blocker.y - bounds.y - bounds.height) / direction.y)
      if (exits.length === 0) return null
      step = Math.max(step, Math.min(...exits))
    }
    step += NOTE_TARGET_DOT_RADIUS + 1
    moved += step
    if (moved > maxOffset) return null
    bounds.x += direction.x * step
    bounds.y += direction.y * step
  }
  return null
}

function targetDotBounds(point: XYPoint): BBox {
  return {
    x: point.x - NOTE_TARGET_DOT_RADIUS,
    y: point.y - NOTE_TARGET_DOT_RADIUS,
    width: NOTE_TARGET_DOT_RADIUS * 2,
    height: NOTE_TARGET_DOT_RADIUS * 2,
  }
}

function contentBounds(architectureBounds: BBox, placements: readonly NotePlacement[]): BBox {
  let minX = architectureBounds.x
  let minY = architectureBounds.y
  let maxX = architectureBounds.x + architectureBounds.width
  let maxY = architectureBounds.y + architectureBounds.height
  for (const placement of placements) {
    const { bounds, leader } = placement
    minX = Math.min(minX, bounds.x, leader.from.x, leader.to.x - NOTE_TARGET_DOT_RADIUS)
    minY = Math.min(minY, bounds.y, leader.from.y, leader.to.y - NOTE_TARGET_DOT_RADIUS)
    maxX = Math.max(maxX, bounds.x + bounds.width, leader.from.x, leader.to.x + NOTE_TARGET_DOT_RADIUS)
    maxY = Math.max(maxY, bounds.y + bounds.height, leader.from.y, leader.to.y + NOTE_TARGET_DOT_RADIUS)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Place visible note cards without changing the architecture layout. */
export function placeNoteCards(
  { architectureBounds, targets, obstacles, segments }: NotePlacementInput,
): NotePlacementResult {
  const ordered = [...targets].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'node' ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
  const placements: NotePlacement[] = []
  // ponytail: scan a readable note set; add spatial indexing only if normal views become slow.
  const protectedObstacles = [...obstacles]
  // Protect relationship target dots before node cards are placed.
  for (const target of ordered) {
    if (target.kind !== 'edge') continue
    protectedObstacles.push({
      ownerId: target.id,
      bounds: targetDotBounds(target.anchor),
    })
  }
  for (const target of ordered) {
    const candidates = target.kind === 'node' ? nodeCandidates(target) : edgeCandidates(target)
    let best = candidates[0]!
    let bestScore = score(best, target.id, protectedObstacles, segments, placements)
    for (const candidate of candidates.slice(1)) {
      const candidateScore = score(candidate, target.id, protectedObstacles, segments, placements, bestScore)
      if (better(candidateScore, bestScore)) {
        best = candidate
        bestScore = candidateScore
      }
    }
    // Prefer a nearby nudge; extend farther only when all nearby positions are occupied.
    for (const maxOffset of [Math.max(target.size.width, target.size.height), Infinity]) {
      if (bestScore[0] === 0 && (bestScore[1] === 0 || maxOffset === Infinity)) break
      for (const candidate of candidates) {
        const nudged = nudgeClear(candidate, protectedObstacles, placements, maxOffset)
        if (!nudged) continue
        const nudgedScore = score(nudged, target.id, protectedObstacles, segments, placements, bestScore)
        if (better(nudgedScore, bestScore)) {
          best = nudged
          bestScore = nudgedScore
        }
      }
    }
    placements.push(best)
    protectedObstacles.push({
      ownerId: best.id,
      bounds: targetDotBounds(best.leader.to),
    })
  }
  return { placements, bounds: contentBounds(architectureBounds, placements) }
}
