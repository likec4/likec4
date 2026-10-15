import { describe, it } from 'vitest'
import { createTestServices } from '../test/testServices'

const model = `
  specification {
    element component
  }
  model {
    a = component 'A'
    b = component 'B'
    a -> b
  }
`

describe('view routing validation', () => {
  it('warns when routing is set both as a property and as autoLayout sugar', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors, warnings } = await validate(`
      ${model}
      views {
        view index {
          routing spline
          include *
          autoLayout TopBottom ortho
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings.join('\n')).toMatch(/routing/i)
  })

  it('does not warn for a property alone or for sugar alone', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors, warnings } = await validate(`
      ${model}
      views {
        view withProperty {
          routing ortho
          include *
        }
        view withSugar {
          include *
          autoLayout TopBottom ortho
        }
        deployment view deployments {
          routing: ortho
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })
})
