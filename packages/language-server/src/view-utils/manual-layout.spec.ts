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
    autoLayout: { direction: 'TB' },
    x: -10,
    y: -20,
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
       * iKRoYXNopGhhc2iqYXV0b0xheW91dIGpZGlyZWN0aW9uolRCoXj2oXnspmhlaWdodGSld2lkdGjMyKVub2Rlc4Kkc3lzMYKhYpQAAGRkoWPCpHN5czKCoWKUFBQeHqFjw6VlZGdlc4GlZWRnZTGComNwkYKheAqheQqhcJKSAACSZGQ=
       */"
    `)
    expect(deserializeFromComment(commentText)).toEqual(manualLayout)
  })

  it('deserialize from old format', () => {
    const commentText = `/**
       * @likec4-generated(v1)
       * iKRoYXNopGhhc2iqYXV0b0xheW91dKJUQqF49qF57KZoZWlnaHRkpXdpZHRozMilbm9kZXOCpHN5czGCoWKUAABkZKFjwqRzeXMygqFilBQUHh6hY8OlZWRnZXOBpWVkZ2UxgqJjcJGCoXgKoXkKoXCSkgAAkmRk
       */`
    expect(deserializeFromComment(commentText)).toEqual(manualLayout)
  })

  it('deseriazize ignoring spaces', () => {
    expect(deserializeFromComment(`
      /**
       * @likec4-generated(v1)
       *    iKRoYXNopGhhc2iqYXV0b0xheW91dIGpZGlyZWN
       *  0aW9uolRCoXj2oXnspmhlaWdodGSld2lkdGjMyKVub2Rlc4Kkc
       * 3lzMYKhYpQAAGRkoWPCpHN5czKCoWKUFBQeHqFjw6VlZGdlc4GlZWRnZTGComNwkYKheAqheQqhcJKSAACSZGQ=
       */
    `)).toEqual(manualLayout)

    expect(deserializeFromComment(`


      /**
       * @likec4-generated(v1)
       *
       *
       *    iKRoYXNop
       *
       *
       *
       *
       * Ghhc2iqYXV0b0xheW91dIGpZGlyZWN0aW9uolRCoXj2oXnspmhlaWdodGSld2lkdGjMyKVub2Rlc4Kkc3lzMYKhYpQAAGRkoWPCpHN5czKCoWKUFBQeHqFjw6VlZGdlc4GlZWRnZTGComNwkYKheAqheQqhcJKSAACSZGQ=
       */
    `)).toEqual(manualLayout)
  })
})
