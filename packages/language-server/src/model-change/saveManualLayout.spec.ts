import type { EdgeId, Fqn, ViewID } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'
import { saveManualLayout } from './saveManualLayout'

vi.mock('../logger')

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
    const lookup = services.likec4.ModelLocator.locateViewAst('index' as ViewID)
    expect(lookup).toBeDefined()

    const textedit = saveManualLayout(services, {
      ...lookup!,
      nodes: {
        ['sys1' as Fqn]: { x: 0, y: 0, width: 0, height: 0 },
        ['sys2' as Fqn]: { x: 2000, y: -3000, width: 1000000, height: 9000000 }
      },
      edges: {
        ['sys1->sys2' as EdgeId]: { controlPoints: [{ x: 10, y: 10 }, { x: 200, y: 200 }] }
      }
    })
    expect(textedit.newText).toMatchInlineSnapshot(`
      "  /**
         * @likec4-generated(v1)
         * WzEsW1snc3lzMScsMCwwLDAsMF0sWydzeXMyJywyMDAwLC0zMDAwLDEwMDAwMDAsOTAwMDAwMF1dLFtbJ3N5czEtPnN5czInLFsx
         * MCwxMCwyMDAsMjAwXV1dXQ==
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
    const lookup = services.likec4.ModelLocator.locateViewAst('index' as ViewID)
    expect(lookup).toBeDefined()

    const textedit = saveManualLayout(services, {
      ...lookup!,
      nodes: {
        ['el' as Fqn]: { x: 12, y: 34, width: 800, height: 600 }
      },
      edges: {}
    })
    expect(textedit.newText).toMatchInlineSnapshot(`
      " /**
        * @likec4-generated(v1)
        * WzEsW1snZWwnLDEyLDM0LDgwMCw2MDBdXSxbXV0=
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
