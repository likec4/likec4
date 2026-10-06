import { invariant, isElementView, ViewId } from '@likec4/core'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

function projects(consumerModel: string): ReturnType<typeof createMultiProjectTestServices> {
  return createMultiProjectTestServices({
    owner: {
      'model.c4': `
        specification {
          element system
          element container
        }
        model {
          system a {
            container api
            container db
          }
          system b
        }
      `,
    },
    consumer: {
      'model.c4': `
        import { a, b } from 'owner'
        model {
          ${consumerModel}
        }
        views {
          view example {
            include *
          }
        }
      `,
    },
  })
}

// https://github.com/likec4/likec4/issues/3247
describe('issue #3247', () => {
  it('relationship between imported root elements from the same project has no boundary', async ({ expect }) => {
    await using t = await projects(`
      a -> b 'Example relationship'
    `)

    const model = await t.buildLikeC4Model('consumer')
    const [relation, ...rest] = [...model.relationships()]
    invariant(relation)
    expect(rest).toHaveLength(0)
    expect(relation.source.id).toBe('@owner.a')
    expect(relation.target.id).toBe('@owner.b')
    expect(relation.boundary).toBeNull()
    expect(model.element('@owner.a').commonAncestor(model.element('@owner.b'))).toBeNull()

    const view = model.view(ViewId('example')).$view
    invariant(isElementView(view))
    expect(view.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['@owner.a', '@owner.b']))
    expect(view.edges.map(e => [e.source, e.target])).toEqual([['@owner.a', '@owner.b']])
  })

  it('relationship between imported nested elements keeps the imported parent as boundary', async ({ expect }) => {
    await using t = await projects(`
      a.api -> a.db
    `)

    const model = await t.buildLikeC4Model('consumer')
    const [relation, ...rest] = [...model.relationships()]
    invariant(relation)
    expect(rest).toHaveLength(0)
    expect(relation.source.id).toBe('@owner.a.api')
    expect(relation.target.id).toBe('@owner.a.db')
    expect(relation.boundary?.id).toBe('@owner.a')
  })
})
