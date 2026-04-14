import { UriUtils } from 'langium'
import path from 'path'
import { map, mapToObj, pipe } from 'remeda'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

describe('LikeC4', () => {
  it('should parse source and build computed model', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        element user {
          style {
            shape person
          }
        }
      }
      model {
        customer = user 'Customer'
        component system {
          spa = component 'SPA' {
            style {
              shape browser
            }
          }
          mobile = component 'Mobile' {
            style {
              color green
              shape mobile
            }
          }
        }
        customer -> spa
        customer -> mobile
      }
      views {
        view index {
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)

    const model = likec4.syncComputedModel()
    expect([...model.element('customer').outgoing()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.view('index').elements()]).toHaveLength(2)
    expect([...model.view('index').edges()]).toHaveLength(1)
  })

  it('should filter views by metadata predicates', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        element database {
          style {
            shape storage
          }
        }
      }
      model {
        container = component 'Container' {
          prodApi = component 'Prod API' {
            metadata {
              environment 'production'
              critical true
            }
          }
          stagingApi = component 'Staging API' {
            metadata {
              environment 'staging'
            }
          }
          prodDb = database 'PostgreSQL' {
            metadata {
              environment 'production'
            }
          }

          prodApi -> prodDb 'queries' {
            metadata {
              protocol 'tcp'
            }
          }
          stagingApi -> prodDb 'queries' {
            metadata {
              protocol 'http'
            }
          }
        }
      }
      views {
        view prodOnly of container {
          title 'Production Only'
          include * where metadata.environment is "production"
        }
        view excludeStaging of container {
          title 'Exclude Staging'
          include *
          exclude * where metadata.environment is "staging"
        }
        view criticalOnly of container {
          title 'Critical Only'
          include * where metadata.critical is true
        }
        view prodNotDb of container {
          title 'Prod Components (not databases)'
          include *
            where metadata.environment is "production"
              and kind is not database
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)

    const model = likec4.syncComputedModel()

    // prodOnly: only prodApi and prodDb have environment=production
    const prodOnlyElements = [...model.view('prodOnly').elements()]
    const prodOnlyIds = prodOnlyElements.map(e => e.id)
    expect(prodOnlyIds).toContain('container.prodApi')
    expect(prodOnlyIds).toContain('container.prodDb')
    expect(prodOnlyIds).not.toContain('container.stagingApi')

    // excludeStaging: all except stagingApi
    const excludeStagingElements = [...model.view('excludeStaging').elements()]
    const excludeStagingIds = excludeStagingElements.map(e => e.id)
    expect(excludeStagingIds).toContain('container.prodApi')
    expect(excludeStagingIds).toContain('container.prodDb')
    expect(excludeStagingIds).not.toContain('container.stagingApi')

    // criticalOnly: only prodApi has critical=true
    const criticalElements = [...model.view('criticalOnly').elements()]
    const criticalIds = criticalElements.map(e => e.id)
    expect(criticalIds).toContain('container.prodApi')
    expect(criticalIds).not.toContain('container.stagingApi')
    expect(criticalIds).not.toContain('container.prodDb')

    // prodNotDb: production elements that are not database kind
    const prodNotDbElements = [...model.view('prodNotDb').elements()]
    const prodNotDbIds = prodNotDbElements.map(e => e.id)
    expect(prodNotDbIds).toContain('container.prodApi')
    expect(prodNotDbIds).not.toContain('container.prodDb')
    expect(prodNotDbIds).not.toContain('container.stagingApi')
  })

  it('should parse source and build layouted model', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        element user {
          style {
            shape person
          }
        }
      }
      model {
        customer = user 'Customer'
        component system {
          spa = component 'SPA' {
            style {
              shape browser
            }
          }
          mobile = component 'Mobile' {
            style {
              color green
              shape mobile
            }
          }
        }
        customer -> spa
        customer -> mobile
      }
      views {
        view index {
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    expect([...model.element('customer').outgoing()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.view('index').elements()]).toHaveLength(2)
    expect([...model.view('index').edges()]).toHaveLength(1)
    expect(model.view('index').node('system').$node).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
      labelBBox: {
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      },
    })
  })

  it('should not throw error if invalid', async ({ expect }) => {
    try {
      const likec4 = await LikeC4.fromSource(
        `
        specification {
          element component
        }
        model {
          customer = user 'Customer'
          component system
        }
      `,
        {
          printErrors: false,
          throwIfInvalid: false,
        },
      )

      expect(likec4.hasErrors()).toBe(true)
    } catch (err) {
      expect.unreachable()
    }
  })

  it('should throw error if invalid', async ({ expect }) => {
    expect.hasAssertions()
    const promise = LikeC4.fromSource(
      `
      specification {
        element component
      }
      model {
        customer = user 'Customer'
        component system
      }
    `,
      {
        printErrors: false,
        throwIfInvalid: true,
      },
    )

    await expect(promise).rejects.toThrow(
      /source.c4:5 Could not resolve reference to ElementKind named 'user'/,
    )
  })

  it('should parse workspace with multiple projects', async ({ expect }) => {
    const workspace = path.resolve(__dirname, '../../../examples')

    const likec4 = await LikeC4.fromWorkspace(workspace, {
      throwIfInvalid: true,
    })
    expect(likec4.hasErrors()).toBe(false)

    const projects = pipe(
      likec4.languageServices.projects(),
      mapToObj(p => [p.id, {
        folder: UriUtils.basename(p.folder),
        documents: map(p.documents, d => UriUtils.relative(p.folder, d)),
      }]),
    )
    expect(projects).toMatchInlineSnapshot(`
      {
        "boutique": {
          "documents": [
            "_spec.c4",
            "deployment/deployment.c4",
            "deployment/deployment.development.c4",
            "deployment/deployment.production.c4",
            "model.c4",
            "model.views.c4",
            "use-cases/usecase.01-place-order.c4",
            "use-cases/usecase.02-order-fullfillment.c4",
          ],
          "folder": "boutique",
        },
        "cloud-system": {
          "documents": [
            "_spec.c4",
            "cloud/legacy.c4",
            "cloud/next.c4",
            "cloud/ui.c4",
            "deployment.acc.c4",
            "deployment.c4",
            "externals.c4",
            "model.c4",
            "views.c4",
          ],
          "folder": "cloud-system",
        },
        "dyn-config": {
          "documents": [
            "_spec.c4",
            "model.c4",
          ],
          "folder": "dyn-config",
        },
        "issue-1624": {
          "documents": [
            "model.c4",
          ],
          "folder": "issue-1624",
        },
        "metadata-views": {
          "documents": [
            "views.c4",
          ],
          "folder": "metadata-views",
        },
        "multi-metadata-extend": {
          "documents": [
            "base.c4",
            "extend-1.c4",
            "extend-2.c4",
          ],
          "folder": "multi-metadata-extend",
        },
        "multi-relation-extend": {
          "documents": [
            "base.c4",
            "extend-1.c4",
            "extend-2.c4",
          ],
          "folder": "multi-relation-extend",
        },
        "overflow-test": {
          "documents": [
            "model.c4",
          ],
          "folder": "overflow-test",
        },
        "projectA": {
          "documents": [
            "_spec.c4",
            "cloud/legacy.c4",
            "cloud/next.c4",
            "cloud/ui.c4",
            "deployment.acc.c4",
            "deployment.c4",
            "externals.c4",
            "model.c4",
            "views.c4",
          ],
          "folder": "projectA",
        },
        "projectB": {
          "documents": [
            "architecture.c4",
          ],
          "folder": "projectB",
        },
        "rank-for-better-layout": {
          "documents": [
            "demo-rank-for-better-layout.c4",
          ],
          "folder": "rank-for-better-layout",
        },
      }
    `)
  })
})
