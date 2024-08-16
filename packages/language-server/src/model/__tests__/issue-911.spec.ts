import type { ViewID } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

// https://github.com/likec4/likec4/issues/911
describe('Issue 911 - Parent-relations cant contain comments', () => {
  it('should assign label', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element node
      }

      model {
        node a1
        node a2
        a1 -> a2 "comment included"

        node b1 {
          node b11
          node b12
        }
        node b2 {
          node b21
          node b22
        }
        b1 -> b2 "comment not included"
      }

      views {
        view index {
          include *
          include b1, b1.*, b2, b2.*
        }
      }
    `)

    const { views } = await buildModel()
    expect(views).toHaveProperty('index')

    // Uncomment to update snapshot
    // expect(views['index' as ViewID]!).toMatchSnapshot()

    const { edges: [edge1, edge2] } = views['index' as ViewID]!
    expect(edge1).toMatchObject({
      id: 'a1:a2',
      label: 'comment included'
    })
    expect(edge2).toMatchObject({
      id: 'b1:b2',
      label: 'comment not included'
    })
  })
})
