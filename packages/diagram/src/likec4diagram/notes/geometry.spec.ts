import { describe, expect, it } from 'vitest'
import { type EdgeNoteTarget, type NodeNoteTarget, NOTE_CARD_GAP, NOTE_CARD_WIDTH, placeNoteCards } from './geometry'

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

describe('placeNoteCards', () => {
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
    const compoundBorders = [
      { bounds: { x: -19, y: -19, width: 178, height: 4 } },
      { bounds: { x: -19, y: -19, width: 4, height: 158 } },
      { bounds: { x: 155, y: -19, width: 4, height: 158 } },
      { bounds: { x: -19, y: 135, width: 178, height: 4 } },
    ]
    const card = place([node], compoundBorders).placements[0]!
    expect(card.bounds.x).toBeGreaterThanOrEqual(159)
    expect(card.leader.to).toEqual({ x: 120, y: 60 })
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
  })

  it('keeps a diagonal edge leader at the specified gap', () => {
    const edge: EdgeNoteTarget = {
      id: 'api-db',
      kind: 'edge',
      anchor: { x: 80, y: 80 },
      tangent: { x: 1, y: 1 },
      size: { width: NOTE_CARD_WIDTH, height: 80 },
    }
    const card = place([edge]).placements[0]!
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
    expect(result.bounds.width).toBeGreaterThan(architectureBounds.width)
  })
})
