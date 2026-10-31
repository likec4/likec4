import { type LangiumDocument, TextDocument } from 'langium'
import { describe } from 'vitest'
import { createMultiProjectTestServices, testFileScope as it } from '../test'

const spec = `
  specification {
    element component
  }
`

// No Langium references to the docs below (the specification is in its own document),
// so only markdown refs can make them affected
const docs = `
  model {
    component docs {
      description '''
        Calls [[cloud.api]], see [[view:v1]]
      '''
    }
  }
`

const messagesOf = (doc: LangiumDocument) => (doc.diagnostics ?? []).map(d => d.message)

describe('IndexManager', () => {
  describe('isAffected by markdown refs', () => {
    it('revalidates markdown refs when the referenced model changes', async ({ t, expect }) => {
      await t.addDocument(spec)
      const model = await t.addDocument(`
        model {
          component cloud
        }
      `)
      const document = await t.addDocument(docs)
      await t.validateAll()
      expect(messagesOf(document)).toEqual([
        `Element 'cloud.api' not found`,
        `View 'v1' not found`,
      ])

      // Added in another document
      await t.edit(
        model,
        `
        model {
          component cloud {
            component api
          }
        }
        views {
          view v1 {}
        }
      `,
      )
      expect(messagesOf(document)).toEqual([])

      // Renamed
      await t.edit(
        model,
        `
        model {
          component cloud {
            component api2
          }
        }
        views {
          view v2 {}
        }
      `,
      )
      expect(messagesOf(document)).toEqual([
        `Element 'cloud.api' not found`,
        `View 'v1' not found`,
      ])

      // Added back, then the document is removed
      await t.edit(
        model,
        `
        model {
          component cloud {
            component api
          }
        }
        views {
          view v1 {}
        }
      `,
      )
      expect(messagesOf(document)).toEqual([])
      await t.removeDocument(model)
      expect(messagesOf(document)).toEqual([
        `Element 'cloud.api' not found`,
        `View 'v1' not found`,
      ])
    })

    it('does not revalidate documents of other projects', async ({ expect }) => {
      await using services = await createMultiProjectTestServices({
        project1: {
          spec,
          model: `
            model {
              component cloud
            }
          `,
          docs,
        },
        project2: {
          spec,
          docs,
          plain: `
            model {
              component other
            }
          `,
        },
      })
      const { project1, project2 } = services.projects
      const indexManager = services.services.shared.workspace.IndexManager
      await services.validateAll()

      const changed = new Set([project1.model.uri.toString()])
      expect(indexManager.isAffected(project1.docs, changed)).toBe(true)
      expect(indexManager.isAffected(project2.docs, changed)).toBe(false)
      // No `[[` in the text
      expect(indexManager.isAffected(project1.spec, changed)).toBe(false)

      const project2Diagnostics = project2.docs.diagnostics
      expect(messagesOf(project2.docs)).toEqual([
        `Element 'cloud.api' not found`,
        `View 'v1' not found`,
      ])

      const textDocuments = services.services.shared.workspace.TextDocuments!
      textDocuments.set(TextDocument.create(
        project1.model.uri.toString(),
        project1.model.textDocument.languageId,
        project1.model.textDocument.version + 1,
        `
          model {
            component cloud {
              component api
            }
          }
          views {
            view v1 {}
          }
        `,
      ))
      await services.services.shared.workspace.DocumentBuilder.update([project1.model.uri], [])

      expect(messagesOf(project1.docs)).toEqual([])
      // Not revalidated: the same diagnostics array
      expect(project2.docs.diagnostics).toBe(project2Diagnostics)
    })
  })
})
