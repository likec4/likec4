import type { ViewId } from '@likec4/core'
import { withReadableEdges } from '@likec4/core/compute-view'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

// https://github.com/likec4/likec4/issues/3197
describe('Issue 3197 - empty string in "with" should hide title and technology', () => {
  it('should hide relationship title and technology', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element actor
        element system
      }

      model {
        customer = actor 'Customer'
        saas = system 'Our SaaS'
        customer -> saas 'enjoys our product' {
          technology 'HTTPS'
        }
      }

      views {
        view index {
          include customer, saas
          include * -> * with {
            title ''
            technology ''
          }
        }
      }
    `)

    const { views } = await buildModel()
    const { edges: [edge] } = withReadableEdges(views['index' as ViewId]!)
    expect(edge).toMatchObject({
      id: 'customer:saas',
      label: '',
      technology: '',
    })
  })

  it('should hide element title', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element actor
      }

      model {
        customer = actor 'Customer' {
          description 'The regular customer'
          technology 'Human'
        }
      }

      views {
        view index {
          include customer with {
            title ''
            technology ''
          }
        }
      }
    `)

    const { views } = await buildModel()
    const { nodes: [node] } = views['index' as ViewId]!
    expect(node).toMatchObject({
      id: 'customer',
      title: '',
      technology: '',
    })
  })
})
