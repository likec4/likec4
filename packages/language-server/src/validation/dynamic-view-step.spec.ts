import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

describe.concurrent('dynamicViewStepChecks', () => {
  it('should not report invalid relations', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
      }
      views {
        dynamic view index {
          c1 -> c2
          c1 <- c2
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should report invalid step target', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        dynamic view {
          c1 -> c2
        }
      }
    `)
    expect(errors).to.include.members(['Target not found (not parsed/indexed yet)'])
  })

  it('should report invalid step source', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        dynamic view index {
          c2 -> c1
        }
      }
    `)
    expect(errors).to.include.members(['Source not found (not parsed/indexed yet)'])
  })

  it('should report invalid step: -> nested child', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3
          }
        }
      }
      views {
        dynamic view index {
          c1 -> c3
        }
      }
    `)
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })

  it('should report invalid step: child -> parent', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3
          }
        }
      }
      views {
        dynamic view index {
          c3 -> c1
        }
      }
    `)
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })
})
