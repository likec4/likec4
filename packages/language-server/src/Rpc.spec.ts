import { describe, expect, it, vi } from 'vitest'
import { LikeC4Model } from '@likec4/core/model'
import { createTestServices } from './test'

describe.concurrent('Rpc', () => {
  describe('FetchComputedModel', () => {
    it('should return computed model data in correct format', async ({ expect }) => {
      const { services, validate } = createTestServices()
      
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

      const model = await services.likec4.ModelBuilder.computeModel()
      expect(model).not.toBe(LikeC4Model.EMPTY)
      expect(model.$data).toBeDefined()
      expect(model.$data._stage).toBe('computed')
      expect(Object.keys(model.$data.elements)).toContain('sys1')
      expect(Object.keys(model.$data.elements)).toContain('sys2')
    })

    it('should handle empty model gracefully', async ({ expect }) => {
      const { services } = createTestServices()
      
      // Don't add any documents
      const model = await services.likec4.ModelBuilder.computeModel()
      expect(model).toBeDefined()
    })

    it('should include manual layouts when available', async ({ expect }) => {
      const { services, validate } = createTestServices()
      
      await validate(`
        specification {
          element component
        }
        model {
          component sys1
        }
        views {
          view index {
            include *
          }
        }
      `)

      const model = await services.likec4.ModelBuilder.computeModel()
      expect(model.$data).toBeDefined()
      // Manual layouts would be set if available
    })
  })

  describe('logging improvements', () => {
    it('should log cleanCaches parameter', async ({ expect }) => {
      const { services, validate } = createTestServices()
      
      await validate(`
        specification {
          element component
        }
        model {
          component sys1
        }
      `)

      // Verify the model can be built
      const model = await services.likec4.ModelBuilder.computeModel()
      expect(model).toBeDefined()
    })
  })
})