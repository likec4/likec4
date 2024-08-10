import { describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

describe.concurrent('incomingExpressionChecks', () => {
  it('should not warn if view of', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view of c1 {
          include -> *
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should warn if -> *', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      views {
        view v1 {
          include -> *
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(2)
      expect(diagnostic.message, 'diagnostic message').toBe(
        'Predicate is ignored as it concerns all relationships'
      )
    }
  })
})
