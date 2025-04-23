import { describe, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

describe('import checks', () => {
  it('should report invalid import from same project (default)', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      import c1 from 'default'
      specification {
        element component
      }
      model {
        component c1
      }
    `)
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project cannot be the same as the current project' },
    ])
  })

  it('should report invalid import from same project (non-default)', async ({ expect }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
        'doc2': `
          import c1 from 'project1'
        `,
      },
    })

    const { diagnostics } = await validateAll()
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: 'Imported project cannot be the same as the current project' },
    ])
  })

  it('should report invalid import', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      import c1 from 'project1'
    `)
    expect.soft(diagnostics).toHaveLength(2)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: `Could not resolve reference to Element named 'c1'.` },
      { severity: 1, message: 'Imported project not found' },
    ])
  })

  it('should not report valid imports', async ({ expect }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
            component c2
          }
        `,
      },
      project2: {
        'doc2': `
          import c1 from 'project1'
          import c2 from 'project1'
        `,
      },
      project3: {
        'doc2': `
          import { c1, c2 } from 'project1'
        `,
      },
    })

    const { diagnostics } = await validateAll()
    expect.soft(diagnostics).toHaveLength(0)
  })
  it('should report invalid imports from another project', async ({ expect }) => {
    const { validateAll } = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
      project2: {
        'doc1': `
          import c2 from 'project1'
        `,
      },
    })

    const { diagnostics } = await validateAll()
    expect.soft(diagnostics).toHaveLength(1)
    expect(diagnostics).toMatchObject([
      { severity: 1, message: `Could not resolve reference to Element named 'c2'.` },
    ])
  })
})
