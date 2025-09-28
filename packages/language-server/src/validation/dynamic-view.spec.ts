import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('DynamicView Checks', () => {
  describe('stepChecks', () => {
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

    it('should report invalid step: A <- B -> C', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          A <- B -> C
        }
      }
    `)
      expect(errors).toEqual(['Invalid chain after backward step'])
    })

    it('should not report self-reference (loop)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2
        }
      }
      views {
        dynamic view index {
          c2 -> c2
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })
  })

  describe('display variant', () => {
    it('should report if invalid mode', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      views {
        dynamic view index {
          variant invalid
        }
      }
    `)
      expect(errors).to.include.members(['Invalid display variant: "diagram" or "sequence" are allowed'])
    })

    it('should not report for valid modes', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      views {
        dynamic view index {
          variant sequence
        }
        dynamic view index2 {
          variant diagram
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })
  })
})
