import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('viewChecks', () => {
  it('should report duplicate view names', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      views {
        view v1 {
        }
        view v1 {
        }
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate view \'v1\'')
    }
  })

  it('should report duplicate view names for dynamic', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      views {
        dynamic view v2 {
        }
        dynamic view v2 {
        }
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate view \'v2\'')
    }
  })

  it('should report duplicate view names between dynamic and element', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      views {
        dynamic view v3 {
        }
        view v3 {
        }
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate view \'v3\'')
    }
  })
})
