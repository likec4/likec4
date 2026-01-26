import { shallowEqual } from 'fast-equals'
import { indexBy } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe('LikeC4Views', () => {
  it('diagrams returns cached result', async ({ expect }) => {
    const { validate, services } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include *
        }
      }
    `)
    const diagrams1 = await services.likec4.Views.diagrams()
    const diagrams2 = await services.likec4.Views.diagrams()
    expect(diagrams2 !== diagrams1).toBe(true)
    expect(shallowEqual(diagrams1, diagrams2)).toBe(true)
  })

  it('diagrams returns cached result if there are no changes', async ({ expect }) => {
    const { parse, validateAll, services } = createTestServices()
    await parse(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2 {
          component sys22 {
            -> sys1
          }
        }
      }
      views {
        view index {
          include *
        }
        view sys2 of sys2 {
          include *
        }
      }
    `)

    const first = await validateAll()
    expect(first.errors).toHaveLength(0)

    const diagrams1 = await services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))
    // add model
    await parse(`
      model {
        component sys3
      }
    `)

    const second = await validateAll()
    expect(second.errors).toHaveLength(0)

    const diagrams2 = await services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))

    // index view has changed
    expect(diagrams1.index).not.toStrictEqual(diagrams2.index)
    // expect that sys2 view is the same
    expect(diagrams1.sys2).toStrictEqual(diagrams2.sys2)
  })
})
