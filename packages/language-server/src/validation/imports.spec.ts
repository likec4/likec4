import { describe, expect, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

const specs = `
  specification {
    element system
    element component
  }
`

describe('importsFromProjectChecks', () => {
  it('should report invalid import from same project', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      import c1 from 'project1'
    `)
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project not found' },
      { severity: 1, message: 'Invalid import' },
    ])
  })

  it('should report invalid import', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      import c1 from 'project1'
    `)
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project not found' },
      { severity: 1, message: 'Invalid import' },
    ])
  })
})
