import { describe, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

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

  it('should report duplicate view names in same project', async ({ expect }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        views1: `
          views {
            view v1 {}
          }
        `,
        views2: `
          views {
            view v1 {}
          }
        `,
      },
    })
    const { diagnostics } = await validateAll()
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: `Duplicate view 'v1'` },
      { severity: 1, message: `Duplicate view 'v1'` },
    ])
  })

  it('should not report duplicate view names from different projects', async ({ expect }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        views1: `
          views {
            view v1 {}
          }
        `,
      },
      project2: {
        views1: `
          views {
            view v1 {}
          }
        `,
      },
    })

    const { errors, warnings } = await validateAll()
    expect(errors).toHaveLength(0)
    expect(warnings).toHaveLength(0)
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
