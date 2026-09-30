import { describe, expect, it } from 'vitest'
import {
  type EdgeNoteTarget,
  type NodeNoteTarget,
  type NoteObstacle,
  type NotePlacement,
  compoundFrameObstacles,
  NOTE_CARD_GAP,
  NOTE_CARD_WIDTH,
  placeNoteCards,
} from './geometry'

const architectureBounds = { x: 0, y: 0, width: 200, height: 120 }
const node: NodeNoteTarget = {
  id: 'api',
  kind: 'node',
  bounds: { x: 20, y: 20, width: 100, height: 80 },
  size: { width: NOTE_CARD_WIDTH, height: 60 },
}

function place(
  targets: (NodeNoteTarget | EdgeNoteTarget)[],
  obstacles = [] as { bounds: typeof architectureBounds; ownerId?: string }[],
  segments = [] as { from: { x: number; y: number }; to: { x: number; y: number }; ownerId?: string }[],
) {
  return placeNoteCards({ architectureBounds, targets, obstacles, segments })
}

function expectClearOf(card: NotePlacement, obstacles: readonly NoteObstacle[]) {
  for (const { bounds } of obstacles) {
    const width = Math.max(
      0,
      Math.min(card.bounds.x + card.bounds.width, bounds.x + bounds.width) - Math.max(card.bounds.x, bounds.x),
    )
    const height = Math.max(
      0,
      Math.min(card.bounds.y + card.bounds.height, bounds.y + bounds.height) - Math.max(card.bounds.y, bounds.y),
    )
    expect(width * height).toBe(0)
  }
  const { from } = card.leader
  const { x, y, width, height } = card.bounds
  expect(from.x).toBeGreaterThanOrEqual(x)
  expect(from.x).toBeLessThanOrEqual(x + width)
  expect(from.y).toBeGreaterThanOrEqual(y)
  expect(from.y).toBeLessThanOrEqual(y + height)
  expect(
    [x, x + width].some(side => Math.abs(from.x - side) < 1e-6) ||
      [y, y + height].some(side => Math.abs(from.y - side) < 1e-6),
  ).toBe(true)
}

describe('placeNoteCards', () => {
  it('models the compound heading and border as four obstacles', () => {
    expect(compoundFrameObstacles({ x: -19, y: -19, width: 178, height: 158 }, 'group')).toEqual([
      { bounds: { x: -19, y: -19, width: 178, height: 40 }, ownerId: 'group' },
      { bounds: { x: -19, y: 21, width: 4, height: 118 }, ownerId: 'group' },
      { bounds: { x: 155, y: 21, width: 4, height: 118 }, ownerId: 'group' },
      { bounds: { x: -19, y: 135, width: 178, height: 4 }, ownerId: 'group' },
    ])
  })

  it('keeps architecture bounds when there are no notes', () => {
    expect(place([])).toEqual({ placements: [], bounds: architectureBounds })
  })

  it('places a node card at its right boundary and includes the card in content bounds', () => {
    const result = place([node])
    const card = result.placements[0]!
    expect(card.bounds).toEqual({ x: 144, y: 30, width: NOTE_CARD_WIDTH, height: 60 })
    expect(card.leader).toEqual({ from: { x: 144, y: 60 }, to: { x: 120, y: 60 } })
    expect(result.bounds).toEqual({ x: 0, y: 0, width: 384, height: 120 })
  })

  it('avoids an occupied right side and uses the next clear node position', () => {
    const rightObstacle = { bounds: { x: 140, y: 0, width: 260, height: 105 } }
    const card = place([node], [rightObstacle]).placements[0]!
    expect(card.bounds.x).toBeCloseTo(120 + NOTE_CARD_GAP / Math.SQRT2)
    expect(card.bounds.y).toBeCloseTo(100 + NOTE_CARD_GAP / Math.SQRT2)
    expect(card.leader.to).toEqual({ x: 120, y: 100 })
    expect(Math.hypot(card.leader.from.x - card.leader.to.x, card.leader.from.y - card.leader.to.y))
      .toBeCloseTo(NOTE_CARD_GAP)
  })

  it('places a node card beyond its compound border', () => {
    const compoundBorders = compoundFrameObstacles({ x: -19, y: -19, width: 178, height: 158 }, 'group')
    const card = place([node], compoundBorders).placements[0]!
    expect(card.bounds.x).toBeGreaterThanOrEqual(159)
    expect(card.leader.to).toEqual({ x: 120, y: 60 })
    expectClearOf(card, compoundBorders)
  })

  it('clears a compound border when 48 units of space is not enough', () => {
    const target: NodeNoteTarget = { ...node, bounds: { x: 0, y: 0, width: 100, height: 80 } }
    const frame = compoundFrameObstacles({ x: -50, y: -50, width: 200, height: 180 }, 'group')
    const card = place([target], frame).placements[0]!
    expectClearOf(card, frame)
    expect(card.leader.to).toEqual({ x: 100, y: 40 })
    expect(Math.hypot(card.leader.from.x - card.leader.to.x, card.leader.from.y - card.leader.to.y))
      .toBeGreaterThan(NOTE_CARD_GAP * 2)
  })

  it('scores edge crossings after overlap and skips the target edge', () => {
    const rightCrossing = { from: { x: 132, y: 45 }, to: { x: 132, y: 75 }, ownerId: 'other' }
    const card = place([node], [], [rightCrossing]).placements[0]!
    expect(card.bounds.y).toBeGreaterThan(100)

    const ownEdge = { ...rightCrossing, ownerId: node.id }
    const ownBody = { bounds: { x: 144, y: 30, width: 240, height: 60 }, ownerId: node.id }
    const ownCard = place([node], [ownBody], [ownEdge]).placements[0]!
    expect(ownCard.bounds.x).toBe(144)
  })

  it('keeps a node card off a relationship path that does not cross its leader', () => {
    const relationship = { from: { x: 160, y: 60 }, to: { x: 400, y: 60 }, ownerId: 'other' }
    const card = place([node], [], [relationship]).placements[0]!
    expect(card.bounds.y).toBeGreaterThan(100)
  })

  it('keeps a relationship leader out of a nearby label', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 0, y: 0 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 60 },
    }
    const label = { bounds: { x: -30, y: 2, width: 60, height: 20 } }
    const card = place([edge], [label]).placements[0]!
    expect(card.bounds.y + card.bounds.height).toBeLessThan(0)
    expect(card.leader.to).toEqual(edge.anchor)
  })

  it('protects a relationship target dot before placing node cards', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 200, y: 60 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 60 },
    }
    const result = place([node, edge])
    expectClearOf(result.placements[0]!, [{ bounds: { x: 197, y: 57, width: 6, height: 6 } }])
    expectClearOf(result.placements[1]!, [{ bounds: result.placements[0]!.bounds }])
  })

  it('sorts nodes before edges by ID and avoids previously placed cards', () => {
    const laterNode = { ...node, id: 'z' }
    const firstNode = { ...node, id: 'a' }
    const edge: EdgeNoteTarget = {
      id: '0',
      kind: 'edge',
      anchor: { x: 100, y: 100 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 60 },
    }
    const result = place([edge, laterNode, firstNode])
    expect(result.placements.map(p => p.id)).toEqual(['a', 'z', '0'])
    expect(result.placements[0]!.bounds).toEqual({ x: 144, y: 30, width: 240, height: 60 })
    expect(result.placements[1]!.bounds.y).toBeGreaterThan(100)
    expect(place([firstNode, laterNode, edge])).toEqual(result)
  })

  it('places an edge card on the path normal with a straight 24-unit leader', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 80, y: 80 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 80 },
    }
    const card = place([edge]).placements[0]!
    expect(card.bounds.x).toBeCloseTo(-40)
    expect(card.bounds.y).toBeCloseTo(80 + NOTE_CARD_GAP)
    expect(card.leader.to).toEqual(edge.anchor)
    expect(card.leader.from.x).toBeCloseTo(80)
    expect(card.leader.from.y).toBeCloseTo(80 + NOTE_CARD_GAP)
  })

  it('uses the opposite edge normal when the first side is occupied', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 80, y: 80 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 80 },
    }
    const lowerObstacle = { bounds: { x: -100, y: 100, width: 400, height: 200 } }
    const card = place([edge], [lowerObstacle]).placements[0]!
    expect(card.bounds.y + card.bounds.height).toBeCloseTo(80 - NOTE_CARD_GAP)
  })

  it('moves an edge card clear of nodes on both sides of the connection', () => {
    const edge: EdgeNoteTarget = {
      id: 'customer-dashboard',
      kind: 'edge',
      anchor: { x: 430, y: 90 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 180 },
    }
    const customer = { bounds: { x: 0, y: 0, width: 320, height: 180 } }
    const dashboard = { bounds: { x: 560, y: 0, width: 320, height: 180 } }
    const card = place([edge], [customer, dashboard]).placements[0]!
    expect(card.bounds.y).toBeGreaterThanOrEqual(180)
    expect(card.bounds.x).toBe(310)
    expect(card.leader.to).toEqual(edge.anchor)
    expectClearOf(card, [customer, dashboard])
  })

  it('moves an edge card along the connection to clear a compound border', () => {
    const edge: EdgeNoteTarget = {
      id: 'customer-dashboard',
      kind: 'edge',
      anchor: { x: 430, y: 90 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 180 },
    }
    const customer = { bounds: { x: 0, y: 0, width: 320, height: 180 } }
    const dashboard = { bounds: { x: 560, y: 0, width: 320, height: 180 } }
    const compoundBorder = { bounds: { x: 540, y: 210, width: 400, height: 4 } }
    const card = place([edge], [customer, dashboard, compoundBorder]).placements[0]!
    expect(card.bounds.y).toBeGreaterThanOrEqual(180)
    expect(card.bounds.x + card.bounds.width).toBeLessThanOrEqual(540)
    expect(card.leader.to).toEqual(edge.anchor)
    expectClearOf(card, [customer, dashboard, compoundBorder])
  })

  it('nudges a short edge card past taller elements', () => {
    const edge: EdgeNoteTarget = {
      id: 'customer-dashboard',
      kind: 'edge',
      anchor: { x: 430, y: 150 },
      tangent: { x: 1, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 60 },
    }
    const customer = { bounds: { x: 0, y: 0, width: 320, height: 300 } }
    const dashboard = { bounds: { x: 560, y: 0, width: 320, height: 300 } }
    const card = place([edge], [customer, dashboard]).placements[0]!
    expectClearOf(card, [customer, dashboard])
    expect(card.leader.to).toEqual(edge.anchor)
  })

  it('nudges another candidate when the best initial direction cannot clear a body nearby', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 0, y: 0 },
      tangent: { x: 0, y: 1 },
      size: { width: NOTE_CARD_WIDTH, height: 60 },
    }
    const bodies = [
      { bounds: { x: -200, y: -100, width: 100, height: 200 } },
      { bounds: { x: 250, y: -300, width: 500, height: 600 } },
      { bounds: { x: -50, y: -300, width: 100, height: 100 } },
      { bounds: { x: -50, y: 200, width: 100, height: 100 } },
    ]
    const path = { from: { x: 0, y: -200 }, to: { x: 0, y: 200 }, ownerId: edge.id }
    const card = place([edge], bodies, [path]).placements[0]!
    expectClearOf(card, bodies)
    expect(Math.hypot(card.leader.from.x, card.leader.from.y)).toBeLessThan(NOTE_CARD_WIDTH)
  })

  it('keeps a diagonal edge leader on the normal at the specified gap', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 80, y: 80 },
      tangent: { x: 1, y: 1 },
      size: { width: NOTE_CARD_WIDTH, height: 80 },
    }
    const card = place([edge]).placements[0]!
    expect(card.leader.from.x - card.leader.to.x).toBeCloseTo(-NOTE_CARD_GAP / Math.SQRT2)
    expect(card.leader.from.y - card.leader.to.y).toBeCloseTo(NOTE_CARD_GAP / Math.SQRT2)
    expect(Math.hypot(card.leader.to.x - card.leader.from.x, card.leader.to.y - card.leader.from.y))
      .toBeCloseTo(NOTE_CARD_GAP)
  })

  it('uses a horizontal normal for a degenerate edge tangent', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 80, y: 80 },
      tangent: { x: 0, y: 0 },
      size: { width: NOTE_CARD_WIDTH, height: 80 },
    }
    const card = place([edge]).placements[0]!
    expect(card.bounds.x).toBeCloseTo(80 + NOTE_CARD_GAP)
    expect(card.leader.to).toEqual(edge.anchor)
  })

  it('always renders a card in a dense view and includes its extents', () => {
    const obstacle = { bounds: { x: -1000, y: -1000, width: 2000, height: 2000 } }
    const result = place([node], [obstacle])
    expect(result.placements).toHaveLength(1)
    expect(result.placements[0]!.bounds.width).toBe(NOTE_CARD_WIDTH)
    expectClearOf(result.placements[0]!, [obstacle])
    expect(result.bounds.width).toBeGreaterThan(architectureBounds.width)
  })
})
