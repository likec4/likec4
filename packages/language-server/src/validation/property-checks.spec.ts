import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'

describe('property-checks', () => {
  describe('icon', () => {
    it('should error duplicate icon inside style', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            style {
              icon tech:kafka
              icon tech:akka
            }
          }
        }
      `)
      expect(errors).toEqual([
        'Icon must be defined once',
        'Icon must be defined once'
      ])
    })

    it('should error duplicate icon on element', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            icon tech:kafka
            icon tech:akka
          }
        }
      `)
      expect(errors).toEqual([
        'Icon must be defined once',
        'Icon must be defined once'
      ])
    })

    it('should warn redundant icon', async ({ expect }) => {
      const { validate } = createTestServices()
      const { warnings } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            icon tech:nodejs
            style {
              icon tech:kafka
            }
          }
        }
      `)
      expect(warnings).toEqual([
        'Redundant as icon defined on element'
      ])
    })
  })

  describe('notes', () => {
    it('should report invalid notes', async ({ expect }) => {
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
        view index {
          include c2 -> c1 with {
            notes "some notes"
          }
        }
      }
    `)
      expect(errors).toEqual(['Notes can be defined only inside dynamic view'])
    })

    it('should not report notes in dynamic view', async ({ expect }) => {
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
          c2 -> c1 {
            notes "some notes"
          }
        }
      }
    `)
      expect(errors).to.be.empty
      expect.hasAssertions()
    })
  })
})
