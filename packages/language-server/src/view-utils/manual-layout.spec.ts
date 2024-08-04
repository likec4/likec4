import type { ElementView, Fqn, ViewID, ViewManualLayout } from '@likec4/core'
import { mapToObj } from 'remeda'
import { describe, expect, it } from 'vitest'
import { deserializeFromComment, serializeToComment } from './manual-layout'

function views(...views: ElementView[]): Record<ViewID, ElementView> {
  return mapToObj(views, view => [view.id, view])
}

describe('manual-layout', () => {
  const manualLayout: ViewManualLayout = {
    hash: 'hash',
    height: 100,
    width: 200,
    nodes: {
      'sys1': { x: 0, y: 0, width: 100, height: 100, isCompound: false },
      'sys2': { x: 20, y: 20, width: 30, height: 30, isCompound: true }
    },
    edges: {
      'edge1': {
        points: [[0, 0], [100, 100]],
        controlPoints: [{ x: 10, y: 10 }]
      }
    }
  }

  it('serialize/deseriazize', () => {
    const commentText = serializeToComment(manualLayout)
    expect(commentText).toMatchInlineSnapshot(`
      "/**
       * @likec4-generated(v1)
       * haRoYXNopGhhc2imaGVpZ2h0ZKV3aWR0aMzIpW5vZGVzgqRzeXMxhaF4AKF5AKV3aWR0aGSmaGVpZ2h0ZKppc0NvbXBvdW5kwqRz
       * eXMyhaF4FKF5FKV3aWR0aB6maGVpZ2h0Hqppc0NvbXBvdW5kw6VlZGdlc4GlZWRnZTGCpnBvaW50c5KSAACSZGStY29udHJvbFBv
       * aW50c5GCoXgKoXkK
       */"
    `)
    expect(deserializeFromComment(commentText)).toEqual(manualLayout)
  })

  it('deseriazize ignoring spaces', () => {
    expect(deserializeFromComment(`
      /**
       * @likec4-generated(v1)
       *   haRoYXNopGhhc2imaGVpZ2h0ZKV3aWR0aMzIpW5vZGVzgqRzeXMxhaF4AKF5AKV3aWR0aGSmaGVpZ2h0ZKppc0NvbXBvdW5kwqRz
       * eXMyhaF4FKF5FKV3aWR0aB6maGVpZ2h0Hqppc0NvbXBvdW5kw6VlZGdlc4GlZWRnZTGCpnBvaW50c5KSAACSZGStY29udHJvbFBv
       *    aW50c5GCoXgKoXkK
       */
    `)).toEqual(manualLayout)

    expect(deserializeFromComment(`


      /**
       * @likec4-generated(v1)
       *   haRoYXNopGhhc2imaGVpZ2h0ZKV3aWR0aMzIpW5vZGVzgqRzeXMxhaF4AKF5AKV3aWR0aGSmaGVpZ2h0ZKppc0NvbXBvdW5kwqRz
       *
       *
       *
       *
       * eXMyhaF4FKF5FKV3aWR0aB6maGVpZ2h0Hqppc0NvbXBvdW5kw6VlZG
       * dlc4GlZWRnZTGCpnBvaW50c5KSAACSZGStY29udHJvbFBv
       *    aW50c5GCoXgKoXkK
       */
    `)).toEqual(manualLayout)
  })
})
