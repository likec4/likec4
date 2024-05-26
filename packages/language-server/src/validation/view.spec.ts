import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

describe('viewChecks', () => {
  it('should report duplicate view names', async () => {
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

  it('should report duplicate view names in dynamic and element', async () => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      views {
        dynamic view v2 {
        }
        view v2 {
        }
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate view \'v2\'')
    }
  })
})
