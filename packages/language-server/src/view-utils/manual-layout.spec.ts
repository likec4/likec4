import type { ElementView, Fqn, ViewID, ViewManualLayout } from '@likec4/core'
import { mapToObj } from 'remeda'
import { describe, expect, it } from 'vitest'
import { deserializeFromComment, serializeToComment } from './manual-layout'

function views(...views: ElementView[]): Record<ViewID, ElementView> {
  return mapToObj(views, view => [view.id, view])
}

describe('manual-layout', () => {
  const manualLayout: ViewManualLayout = {
    nodes: {
      ['sys1' as Fqn]: { x: 0, y: 0, width: 0, height: 0 }
    },
    edges: {
      ['sys1->sys2' as Fqn]: { controlPoints: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }
    }
  }

  it('serialize/deseriazize', () => {
    const commentText = serializeToComment(manualLayout)
    expect(commentText).toMatchInlineSnapshot(`
      "/**
       * @likec4-generated(v1)
       * WzEsW1snc3lzMScsMCwwLDAsMF1dLFtbJ3N5czEtPnN5czInLFswLDAsMTAwLDEwMF1dXV0=
       */"
    `)
    expect(deserializeFromComment(commentText)).toEqual(manualLayout)
  })

  it('deseriazize ignoring spaces', () => {
    expect(deserializeFromComment(`
      /**
       * @likec4-generated(v1)
       *   WzEsW1snc3lzMScsMCwwLDAsMF1dLFtb
       * J3N5czEtPnN5czInLFswLDAsMTAwLDEwMF1dXV0=
       */
    `)).toEqual(manualLayout)

    expect(deserializeFromComment(`


      /**
       * @likec4-generated(v1)
       *   WzEsW1snc3lzMScsMCwwLDAsMF1dLFtb
       *
       *
       * J3N5czEtPnN5czInLFswLDAsMTAwLDEwMF1dXV0=
       */
    `)).toEqual(manualLayout)
  })
})
