import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

/**
 * Tests for `LikeC4LanguageServices.format()` — the low-level formatting API
 * (as opposed to the single-document `format` helper exposed by `createTestServices`).
 * This API supports multi-document formatting, `documentUris`/`projectIds` filtering,
 * and formatting options like `tabSize`/`insertSpaces`.
 */
describe('LikeC4LanguageServices.format', () => {
  async function setupServices(...sources: string[]) {
    const { validate, validateAll, services } = createTestServices()
    const docs = []
    for (const source of sources) {
      const { document, errors } = await validate(source)
      expect(errors, `validation errors in source:\n${source}`).toHaveLength(0)
      docs.push(document)
    }
    if (sources.length > 1) {
      const { errors } = await validateAll()
      expect(errors, 'cross-document validation errors').toHaveLength(0)
    }
    const languageServices = services.likec4.LanguageServices
    return { languageServices, docs }
  }

  it('formats all documents when no options specified', async () => {
    const { languageServices } = await setupServices(
      `
        specification {
            element component
        }
        model {
            component sys
        }
      `,
      `
        specification {
            element service
        }
        model {
            service svc
        }
      `,
    )

    const result = await languageServices.format()
    expect(result.size).toBe(2)
  })

  it('returns formatted content for unformatted source', async () => {
    const { languageServices } = await setupServices(`
      specification {
              element component
      }
      model {
              component    sys
      }
    `)

    const result = await languageServices.format()
    expect(result.size).toBe(1)

    const formatted = result.values().next().value
    expect(formatted).toMatchInlineSnapshot(`
      "
      specification {
        element component
      }
      model {
        component sys
      }
          "
    `)
  })

  it('formats only specified documents by documentUris', async () => {
    const { languageServices, docs } = await setupServices(
      `
        specification {
            element component
        }
      `,
      `
        model {
            component sys
        }
      `,
    )

    const targetUri = docs[0]!.uri.toString()
    const result = await languageServices.format({ documentUris: [targetUri] })

    expect(result.size).toBe(1)
    expect(result.has(targetUri)).toBe(true)
    expect(result.has(docs[1]!.uri.toString())).toBe(false)

    const formatted = result.get(targetUri)
    expect(formatted).toBeDefined()
    expect(formatted).toContain('element component')
  })

  it('skips unknown documentUris', async () => {
    const { languageServices } = await setupServices(`
      specification {
          element component
      }
    `)

    const result = await languageServices.format({
      documentUris: ['file:///nonexistent/doc.likec4'],
    })

    expect(result.size).toBe(0)
  })

  it('formatting is idempotent', async () => {
    // First pass: format unformatted source
    const { languageServices, docs } = await setupServices(`
      specification {
              element component
      }
      model {
          component     sys
      }
    `)

    const firstPass = await languageServices.format()
    const docUri = docs[0]!.uri.toString()
    const formatted = firstPass.get(docUri)!
    expect(formatted).toBeDefined()

    // Second pass: create fresh services with the already-formatted output
    const { languageServices: languageServices2, docs: docs2 } = await setupServices(formatted)

    const secondPass = await languageServices2.format()
    const docUri2 = docs2[0]!.uri.toString()
    const formattedAgain = secondPass.get(docUri2)!

    expect(formattedAgain).toBe(formatted)
  })

  it('result Map keys are URI strings matching document URIs', async () => {
    const { languageServices, docs } = await setupServices(
      `
        specification {
            element component
        }
      `,
      `
        model {
            component sys
        }
      `,
    )

    const result = await languageServices.format()

    // All keys should be valid file URIs
    for (const key of result.keys()) {
      expect(key).toMatch(/^file:\/\//)
    }
    // Every document URI should appear in the result
    for (const doc of docs) {
      expect(result.has(doc.uri.toString())).toBe(true)
    }
  })

  describe('projectIds filtering', () => {
    async function setupMultiProject() {
      const { services, projects, validateAll } = await createMultiProjectTestServices({
        alpha: {
          spec: `
            specification {
              element component
            }
          `,
          model: `
            model {
              component alphaSystem
            }
          `,
        },
        beta: {
          spec: `
            specification {
              element service
            }
          `,
          model: `
            model {
              service betaService
            }
          `,
        },
      })
      const { errors } = await validateAll()
      expect(errors, 'cross-document validation errors').toHaveLength(0)
      const languageServices = services.likec4.LanguageServices
      return { languageServices, projects }
    }

    it('formats documents filtered by projectIds', async () => {
      const { languageServices, projects } = await setupMultiProject()

      const result = await languageServices.format({
        projectIds: ['alpha' as ProjectId],
      })

      // Should contain only alpha's 2 documents
      const alphaUris = new Set(
        Object.values(projects.alpha).map(doc => doc.uri.toString()),
      )
      const betaUris = new Set(
        Object.values(projects.beta).map(doc => doc.uri.toString()),
      )

      expect(result.size).toBe(alphaUris.size)
      for (const uri of alphaUris) {
        expect(result.has(uri), `expected alpha doc ${uri}`).toBe(true)
      }
      for (const uri of betaUris) {
        expect(result.has(uri), `unexpected beta doc ${uri}`).toBe(false)
      }

      // Verify content belongs to alpha, not beta
      const allContent = [...result.values()].join('\n')
      expect(allContent).toContain('alphaSystem')
      expect(allContent).not.toContain('betaService')
    })

    it('formats union of projectIds and documentUris', async () => {
      const { languageServices, projects } = await setupMultiProject()

      const betaModelUri = projects.beta.model.uri.toString()

      const result = await languageServices.format({
        projectIds: ['alpha' as ProjectId],
        documentUris: [betaModelUri],
      })

      // Should contain all alpha docs + the one beta doc specified by URI
      const alphaUris = Object.values(projects.alpha).map(doc => doc.uri.toString())

      for (const uri of alphaUris) {
        expect(result.has(uri), `expected alpha doc ${uri}`).toBe(true)
      }
      expect(result.has(betaModelUri), 'expected beta model doc').toBe(true)

      // Should NOT contain beta spec (not in projectIds and not in documentUris)
      const betaSpecUri = projects.beta.spec.uri.toString()
      expect(result.has(betaSpecUri), 'unexpected beta spec doc').toBe(false)

      // alpha (2 docs) + beta model (1 doc) = 3
      expect(result.size).toBe(3)
    })
  })

  describe('formatting options', () => {
    it('respects tabSize option', async () => {
      const { languageServices } = await setupServices(`
        specification {
            element component
        }
        model {
            component sys
        }
      `)

      const result2 = await languageServices.format({ tabSize: 2 })
      const result4 = await languageServices.format({ tabSize: 4 })

      const formatted2 = result2.values().next().value!
      const formatted4 = result4.values().next().value!

      // With tabSize 2, indentation should use 2 spaces but not 4
      expect(formatted2).toContain('\n  element component')
      expect(formatted2).not.toContain('\n    element component')
      // With tabSize 4, indentation should use 4 spaces
      expect(formatted4).toContain('\n    element component')
    })

    it('respects insertSpaces option', async () => {
      const { languageServices } = await setupServices(`
        specification {
            element component
        }
        model {
            component sys
        }
      `)

      const resultSpaces = await languageServices.format({ insertSpaces: true })
      const resultTabs = await languageServices.format({ insertSpaces: false })

      const formattedSpaces = resultSpaces.values().next().value!
      const formattedTabs = resultTabs.values().next().value!

      // Spaces: indentation should not contain tabs
      expect(formattedSpaces).not.toMatch(/\t/)
      // Tabs: indentation should contain tab characters
      expect(formattedTabs).toMatch(/\t/)
    })
  })
})
