import { describe } from 'vitest'
import { createMultiProjectTestServices } from '../test'
import { it } from './_it-spec'

const specs = `
  specification {
    element system
    element component
  }
`

describe('elementChecks', () => {
  it('should report duplicate element names', async ({ expect, validate }) => {
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
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Duplicate element name c1' },
      { severity: 1, message: 'Duplicate element name c1' },
    ])
  })

  it('should report duplicate element names in same project', async ({ expect, validate }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        specs,
        model1: `
          model {
            component c1
          }
        `,
        model2: `
          model {
            component c1
          }
        `,
      },
    })
    const { diagnostics } = await validateAll()
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Duplicate element name c1' },
      { severity: 1, message: 'Duplicate element name c1' },
    ])
  })

  it('should not report duplicate element names from different projects', async ({ expect, validate }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        specs,
        model: `
          model {
            component c1
          }
        `,
      },
      project2: {
        specs,
        model: `
          model {
            component c1
          }
        `,
      },
    })

    const { errors, warnings } = await validateAll()
    expect(errors).toHaveLength(0)
    expect(warnings).toHaveLength(0)
  })

  it('should report duplicate element names in extendElement', async ({ expect, validateAll, t }) => {
    await t.parse(`
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
    await t.parse(`
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

  it('should not report duplicate element names in nested', async ({ expect, validate }) => {
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
