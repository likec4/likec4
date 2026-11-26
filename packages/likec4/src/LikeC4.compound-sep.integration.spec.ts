import type { LayoutedView } from '@likec4/core'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

const source = (autoLayout: string) => `
  specification {
    element system
    element component
    deploymentNode node
  }
  model {
    client = component 'Client'
    left = system 'Left' {
      one = component 'One'
      two = component 'Two'
    }
    right = system 'Right' {
      one = component 'One'
      two = component 'Two'
    }
    client -> left.one
    client -> left.two
    client -> right.one
    client -> right.two
  }
  deployment {
    node clientNode {
      instanceOf client
    }
    node leftNode {
      instanceOf left.one
      instanceOf left.two
    }
    node rightNode {
      instanceOf right.one
      instanceOf right.two
    }
  }
  views {
    view index {
      include client, left, right, left.*, right.*
      ${autoLayout}
    }
    dynamic view flow {
      include left, right
      client -> left.one
      client -> left.two
      client -> right.one
      client -> right.two
      ${autoLayout}
    }
    deployment view infra {
      include clientNode.**, leftNode.**, rightNode.**
      ${autoLayout}
    }
  }
`

function gapBetween(view: LayoutedView, a: string, b: string) {
  const first = view.nodes.find(n => n.id === a)
  const second = view.nodes.find(n => n.id === b)
  if (!first || !second) {
    throw new Error(`${a} or ${b} not found in ${view.id}`)
  }
  const [l, r] = first.x < second.x ? [first, second] : [second, first]
  return r.x - (l.x + l.width)
}

describe('autoLayout compoundSep', () => {
  it('sets the gap between top-level compounds in element, dynamic and deployment views', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(source('autoLayout TopBottom 120 110 150'))
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    for (
      const [viewId, a, b] of [
        ['index', 'left', 'right'],
        ['flow', 'left', 'right'],
        ['infra', 'leftNode', 'rightNode'],
      ] as const
    ) {
      const view = m.view(viewId).$view
      expect(view.autoLayout, viewId).toMatchObject({ compoundSep: 150 })
      expect(Math.abs(gapBetween(view, a, b) - 150), `${viewId}: gap between ${a} and ${b}`).toBeLessThanOrEqual(1)
    }
  })

  it('leaves views without it unchanged', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(source('autoLayout TopBottom 120 110'))
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    for (const viewId of ['index', 'flow', 'infra']) {
      const view = m.view(viewId).$view
      expect(view.autoLayout, viewId).not.toHaveProperty('compoundSep')
    }
    expect(gapBetween(m.view('index').$view, 'left', 'right')).toBeLessThan(150)
  })
})
