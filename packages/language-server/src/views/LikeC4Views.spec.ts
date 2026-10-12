import type { ViewId } from '@likec4/core'
import { deepEqual } from 'fast-equals'
import { indexBy } from 'remeda'
import { describe } from 'vitest'
import { testFileScope as it } from '../test'

describe('LikeC4Views', () => {
  it('diagrams returns cached result', async ({ expect, t }) => {
    await t.validate(`
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
    const diagrams1 = await t.services.likec4.Views.diagrams()
    const diagrams2 = await t.services.likec4.Views.diagrams()
    expect(diagrams2 !== diagrams1).toBe(true)
    expect(deepEqual(diagrams1, diagrams2)).toBe(true)
  })

  it('diagrams returns cached result if there are no changes', async ({ expect, t }) => {
    await t.parse(`
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

    const first = await t.validateAll()
    expect(first.errors).toHaveLength(0)

    const diagrams1 = await t.services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))
    // add model
    await t.parse(`
      model {
        component sys3
      }
    `)

    const second = await t.validateAll()
    expect(second.errors).toHaveLength(0)

    const diagrams2 = await t.services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))

    // index view has changed
    expect(diagrams1.index).not.toStrictEqual(diagrams2.index)
    // expect that sys2 view is the same
    expect(diagrams1.sys2).toStrictEqual(diagrams2.sys2)
  })

  it('does not return cached layout when only rank constraints change', async ({ expect, t }) => {
    await t.parse(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        component sys3
        sys1 -> sys2
        sys2 -> sys3
      }
    `)
    const views = await t.parse(`
      views {
        view index {
          include *
        }
      }
    `)
    expect((await t.validateAll()).errors).toHaveLength(0)

    const before = await t.services.likec4.Views.layoutView({ viewId: 'index' as ViewId })
    expect(before?.dot).not.toContain('likec4_rankBlocks')

    await t.removeDocument(views)
    await t.parse(`
      views {
        view index {
          include *
          rank same { sys1, sys3 }
        }
      }
    `)
    expect((await t.validateAll()).errors).toHaveLength(0)

    const after = await t.services.likec4.Views.layoutView({ viewId: 'index' as ViewId })
    expect(after?.dot).toContain('likec4_rankBlocks=1')
  })
})
