import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../../test'

vi.mock('../../logger')

describe('expandElementExprChecks', () => {
  it('should not warn', async () => {
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
          include c1._
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should warn if used as incoming target', async () => {
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
          include -> c1._
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(2)
      expect(diagnostic.message, 'diagnostic message').toBe(
        'Wrong usage of expanded element in relations predicate'
      )
    }
  })

  it('should warn if used as target of relation predicate', async () => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
      }
      views {
        view {
          include c2 -> c1._
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(2)
      expect(diagnostic.message, 'diagnostic message').toBe(
        'Wrong usage of expanded element in relations predicate'
      )
    }
  })
})
