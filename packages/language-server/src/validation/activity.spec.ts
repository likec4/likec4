import { describe, it } from 'vitest'
import { createTestServices } from '../test'

const specs = `
  specification {
    element system
    element component
  }
`

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
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Duplicate activity Activity1 (c1#Activity1)' },
      { severity: 1, message: 'Duplicate activity Activity1 (c1#Activity1)' },
    ])
  })
})
