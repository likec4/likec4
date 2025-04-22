import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('activityChecks', () => {
  it('should report duplicate activity names', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          activity Activity1
          activity Activity1
        }
      }
    `)
    expect.soft(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Duplicate activity Activity1 (c1#Activity1)' },
      { severity: 1, message: 'Duplicate activity Activity1 (c1#Activity1)' },
    ])
  })

  it('should report duplicate activity names in extendElement', async ({ expect }) => {
    const { parse, validateAll } = createTestServices()
    await parse(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            activity Activity1
          }
        }
      }
    `)
    await parse(`
      model {
        extend c1.c2 {
          activity Activity1
        }
      }
    `)
    const { diagnostics } = await validateAll()
    expect.soft(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Duplicate activity Activity1 (c1.c2#Activity1)' },
      { severity: 1, message: 'Duplicate activity Activity1 (c1.c2#Activity1)' },
    ])
  })
})
