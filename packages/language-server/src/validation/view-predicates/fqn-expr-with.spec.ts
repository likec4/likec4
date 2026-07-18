import { describe } from 'vitest'
import { testFileScope as it } from '../../test'

describe('checkFqnExprWith', () => {
  //
  it('should not warn', async ({ expect, validate }) => {
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view {
          include
              c1 with {},
              * with {
                color red
              }
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should error if not a element ref', async ({ expect, validate }) => {
    const { errors, warnings } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view {
          include element.kind == component with {}
        }
      }
    `)
    expect(errors).toHaveLength(1)
    expect(errors).toEqual(['Invalid target (expect reference to specific element)'])
  })

  it('should error if used in exclude', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view {
          exclude c1 with {
            title ''
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe(
        'Invalid usage inside "exclude"',
      )
    }
  })
})
