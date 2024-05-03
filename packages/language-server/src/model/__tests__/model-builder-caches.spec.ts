import type { ViewID } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

vi.mock('../../logger')

describe('LikeC4ModelBuilder -- caches', () => {
  it.concurrent('build model returns cached result', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
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

    const model1 = await buildModel()
    const model2 = await buildModel()
    expect(model1).toStrictEqual(model2)
  })

  it.concurrent('return cached views if there are no changes', async ({ expect }) => {
    const { parse, validateAll, buildModel } = createTestServices()
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

    const model1 = await buildModel()

    // add model
    await parse(`
      model {
        component sys3
      }
    `)

    const second = await validateAll()
    expect(second.errors).toHaveLength(0)

    const model2 = await buildModel()

    // model changed
    expect(model1).not.toStrictEqual(model2)

    // index view has changed
    expect(model1.views['index' as ViewID]).not.toStrictEqual(model2.views['index' as ViewID])

    // expect that sys2 view is the same
    expect(model1.views['sys2' as ViewID]).toStrictEqual(model2.views['sys2' as ViewID])
  })
})
