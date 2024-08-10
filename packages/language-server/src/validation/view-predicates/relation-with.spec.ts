import { describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

describe.concurrent('relationPredicateWithChecks', () => {
  it('should not warn', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view {
          include c1 -> * with {
            title ''
          }
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should error if used in exclude', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view {
          exclude c1 -> * with {
            title ''
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe(
        'Invalid usage inside "exclude"'
      )
    }
  })
})
