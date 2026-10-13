import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder - Deployment', () => {
  it('navigates from deployment nodes and instances to deployment views', async ({ expect }) => {
    using t = createTestServices()
    const { diagnostics } = await t.validate(`
      specification {
        element component
        deploymentNode node
      }
      model {
        component frontend
        component backend
        frontend -> backend
      }
      deployment {
        node server {
          instanceOf frontend
          instanceOf backend
        }
      }
      views {
        view logical of frontend {
          include *
        }
        deployment view prod {
          include server with {
            navigateTo server_deployment
          }
        }
        deployment view server_deployment {
          include server.* with {
            navigateTo prod
          }
          include server.frontend with {
            navigateTo frontend_deployment
          }
        }
        deployment view frontend_deployment {
          include server.frontend
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await t.buildModel()
    expect(model.views['prod']?.nodes).toEqual([
      expect.objectContaining({ id: 'server', navigateTo: 'server_deployment' }),
    ])
    expect(model.views['server_deployment']?.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'server.frontend', navigateTo: 'frontend_deployment' }),
      expect.objectContaining({ id: 'server.backend', navigateTo: 'prod' }),
    ]))
    expect(model.views['server_deployment']?.edges).toHaveLength(1)
  })

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
