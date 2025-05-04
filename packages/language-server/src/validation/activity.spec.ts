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

  it('should not report invalid parent-child relationship', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            activity Activity1 {
              -> c3
            }
          }
          component c3
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
  })

  it('should report invalid parent-child relationship', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            activity Activity1 {
              -> c2
            }
          }
        }
      }
    `)
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Invalid parent-child relationship' },
    ])
  })

  it('should not report invalid parent-child relationship (reference to Activity)', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            activity Activity1 {
              -> c2.Activity2
            }
            activity Activity2
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
  })
})
