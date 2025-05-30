import type { ViewId, ViewManualLayout } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'
import { saveManualLayout } from './saveManualLayout'

const layout: ViewManualLayout = {
  hash: 'hash',
  autoLayout: { direction: 'TB' },
  x: -10,
  y: -20,
  height: 100,
  width: 200,
  nodes: {
    'sys1': { x: 0, y: 0, width: 100, height: 100, isCompound: false }
  },
  edges: {
    'edge1': {
      points: [[0, 0], [100, 100]],
      controlPoints: [{ x: 10, y: 10 }]
    }
  }
}

async function mkTestServices() {
  const tst = createTestServices()
  await tst.validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
    `)
  return tst
}

describe('LikeC4ModelChanges - saveManualLayout', () => {
  it('should insert comment', async ({ expect }) => {
    const { services, validate } = await mkTestServices()
    await validate(`
      views {
        view index {
          include *
        }
      }
    `)
    const lookup = services.likec4.ModelLocator.locateViewAst('index' as ViewId)
    expect(lookup).toBeDefined()

    const textedit = saveManualLayout(services, {
      ...lookup!,
      layout
    })
    expect(textedit.newText).toMatchInlineSnapshot(`
      "  /**
         * @likec4-generated(v1)
         * iKRoYXNopGhhc2iqYXV0b0xheW91dIGpZGlyZWN0aW9uolRCoXj2oXnspmhlaWdodGSld2lkdGjMyKVub2Rlc4Gkc3lzMYKhYpQAAGRkoWPCpWVkZ2VzgaVlZGdlMYKiY3CRgqF4CqF5CqFwkpIAAJJkZA==
         */
      "
    `)
    expect(textedit.range).toMatchObject({
      'end': {
        'character': 0,
        'line': 2
      },
      'start': {
        'character': 0,
        'line': 2
      }
    })
  })

  it('should insert block comment even there is line comment', async ({ expect }) => {
    const { services, validate } = await mkTestServices()
    await validate(`
      views {
       // line comment
       view index {
          include *
       }
      }
    `)
    const lookup = services.likec4.ModelLocator.locateViewAst('index' as ViewId)
    expect(lookup).toBeDefined()

    const textedit = saveManualLayout(services, {
      ...lookup!,
      layout
    })
    expect(textedit.newText).toMatchInlineSnapshot(`
      " /**
        * @likec4-generated(v1)
        * iKRoYXNopGhhc2iqYXV0b0xheW91dIGpZGlyZWN0aW9uolRCoXj2oXnspmhlaWdodGSld2lkdGjMyKVub2Rlc4Gkc3lzMYKhYpQAAGRkoWPCpWVkZ2VzgaVlZGdlMYKiY3CRgqF4CqF5CqFwkpIAAJJkZA==
        */
      "
    `)
    expect(textedit.range).toMatchObject({
      'end': {
        'character': 0,
        'line': 3
      },
      'start': {
        'character': 0,
        'line': 3
      }
    })
  })
})
