import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

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
})
