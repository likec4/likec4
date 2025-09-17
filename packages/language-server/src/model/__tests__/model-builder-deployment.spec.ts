import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe.concurrent('LikeC4ModelBuilder - Deployment', () => {
  it('builds deployment model with description, summary and technology', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        deploymentNode node
      }
      model {
        component frontend
      }
      deployment {
        node node1 {
          title 'Node1 title'
          summary 'Noode1 Summary'
          description 'Node1 Description'

          f1 = instanceOf frontend {
            title 'f1 title'
            summary 'f1 summary'
            description 'f1 description'
          }
          f2 = instanceOf frontend 'f2 title' 'f2 summary' {
            title 'ignored title'
            summary 'ignored summary'            
          }
        }
        node node2 'Node2 title' 'Node2 summary' {
          title 'ignored title'
          summary 'ignored summary'
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.deployments.elements).toMatchInlineSnapshot(
      `
      {
        "node1": {
          "description": {
            "txt": "Node1 Description",
          },
          "id": "node1",
          "kind": "node",
          "style": {},
          "summary": {
            "txt": "Noode1 Summary",
          },
          "title": "Node1 title",
        },
        "node1.f1": {
          "description": {
            "txt": "f1 description",
          },
          "element": "frontend",
          "id": "node1.f1",
          "style": {},
          "summary": {
            "txt": "f1 summary",
          },
          "title": "f1 title",
        },
        "node1.f2": {
          "element": "frontend",
          "id": "node1.f2",
          "style": {},
          "summary": {
            "txt": "f2 summary",
          },
          "title": "f2 title",
        },
        "node2": {
          "id": "node2",
          "kind": "node",
          "style": {},
          "summary": {
            "txt": "Node2 summary",
          },
          "title": "Node2 title",
        },
      }
    `,
    )
  })
})
