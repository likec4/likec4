import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'

describe('elementChecks', () => {
  it('should report duplicate element names', async () => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
        component c1
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate element name c1')
    }
  })

  it('should report duplicate element names in extendElement', async () => {
    const { parse, validateAll } = createTestServices()
    await parse(`
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
    `)
    await parse(`
      model {
        extend c1.c2 {
          component c3
        }
      }
    `)
    const { diagnostics } = await validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate element name c3 (c1.c2.c3)')
    }
  })

  it('should not report duplicate element names in nested', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2 {
          component c1
        }
      }
    `)
    expect(errors).toEqual([])
  })
})
