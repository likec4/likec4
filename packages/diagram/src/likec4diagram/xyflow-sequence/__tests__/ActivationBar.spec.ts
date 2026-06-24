import { describe, expect, it } from 'vitest'
import type { Types } from '../../types'

// ---------------------------------------------------------------------------
// Helper — mirrors toSeqActivationNode geometry in sequence-layout.ts
// ---------------------------------------------------------------------------
const ACTIVATION_BAR_WIDTH = 14

function makeActivationNode(
  actorX: number,
  actorWidth: number,
  startY: number,
  endY: number,
  depth: number,
  actorId = 'actor-a',
): {
  data: Types.SequenceActivationNodeData
  position: { x: number; y: number }
  width: number
  height: number
} {
  const actorCenterX = actorX + actorWidth / 2
  const barHalfWidth = ACTIVATION_BAR_WIDTH / 2
  const x = actorCenterX - barHalfWidth + depth * 6
  const height = Math.max(endY - startY, 4)
  return {
    data: {
      actor: actorId,
      depth,
      viewId: 'v1' as Types.SequenceActivationNodeData['viewId'],
      drifts: null,
    },
    position: { x, y: startY },
    width: ACTIVATION_BAR_WIDTH,
    height,
  }
}

describe('SequenceActivationNode geometry', () => {
  it('depth=0: bar is centered on actor lifeline', () => {
    const actorX = 100
    const actorWidth = 120
    const result = makeActivationNode(actorX, actorWidth, 50, 150, 0)
    const expectedCenterX = actorX + actorWidth / 2
    const expectedX = expectedCenterX - ACTIVATION_BAR_WIDTH / 2
    expect(result.position.x).toBe(expectedX)
    expect(result.width).toBe(ACTIVATION_BAR_WIDTH)
  })

  it('depth=1: bar is offset 6px to the right', () => {
    const actorX = 100
    const actorWidth = 120
    const depth0 = makeActivationNode(actorX, actorWidth, 50, 150, 0)
    const depth1 = makeActivationNode(actorX, actorWidth, 50, 150, 1)
    expect(depth1.position.x).toBe(depth0.position.x + 6)
  })

  it('height = endY - startY', () => {
    const result = makeActivationNode(0, 100, 80, 200, 0)
    expect(result.height).toBe(120)
  })

  it('height is at least 4 when startY == endY', () => {
    const result = makeActivationNode(0, 100, 100, 100, 0)
    expect(result.height).toBe(4)
  })

  it('startY becomes the y position', () => {
    const result = makeActivationNode(0, 100, 75, 200, 0)
    expect(result.position.y).toBe(75)
  })

  it('data.depth matches constructor depth', () => {
    const result = makeActivationNode(0, 100, 0, 100, 2)
    expect(result.data.depth).toBe(2)
  })

  it('data.actor carries actor ID', () => {
    const result = makeActivationNode(0, 100, 0, 100, 0, 'service-b')
    expect(result.data.actor).toBe('service-b')
  })
})
