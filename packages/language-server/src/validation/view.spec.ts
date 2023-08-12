import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

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
      expect(diagnostic.message, 'diagnostic message').toBe("Duplicate view 'v1'")
    }
  })
})
