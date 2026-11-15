import { type LangiumDocument, AstUtils } from 'langium'
import { describe } from 'vitest'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { ast } from '../ast'
import { createMultiProjectTestServices, testFileScope as it } from '../test'

/**
 * Returns `$type` of the nodes, to which FQN references with the given text are resolved
 */
function resolvedTypes(doc: LangiumDocument, refText: string): Array<string | undefined> {
  return AstUtils.streamAllContents(doc.parseResult.value)
    .filter(ast.isFqnRef)
    .filter(ref => ref.value.$refText === refText)
    .map(ref => ref.value.ref?.$type)
    .toArray()
}

function errorsOf(doc: LangiumDocument): string[] {
  return (doc.diagnostics ?? [])
    .filter(d => d.severity === DiagnosticSeverity.Error)
    .map(d => typeof d.message === 'string' ? d.message : d.message.value)
}

describe('LikeC4ScopeProvider', () => {
  it('should handle cross-document references', async ({ t, expect }) => {
    await t.addDocument(`
      specification {
        element element
      }
      model {
        element doc1 {
          element next
        }
        extend doc1.next.doc2 {
          element child1
          child1 -> child2
        }
      }
    `)
    await t.addDocument(`
      model {
        extend doc1.next {
          element doc2 {
            element child2
          }
        }
      }
    `)
    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
  })

  it('should prefer nested element of the document over root element from another document', async ({ t, expect }) => {
    const doc1 = await t.addDocument(`
      specification {
        element element
      }
      model {
        element a {
          element x
        }
        element b {
          -> x
        }
      }
    `)
    const doc2 = await t.addDocument(`
      model {
        element x
        element c {
          -> x
        }
      }
    `)
    const { errors } = await t.validateAll()
    expect(errors).toEqual([])

    const fqnIndex = t.services.likec4.FqnIndex
    const resolvedFqns = (doc: LangiumDocument) =>
      AstUtils.streamAllContents(doc.parseResult.value)
        .filter(ast.isFqnRef)
        .filter(ref => ref.value.$refText === 'x')
        .map(ref => fqnIndex.resolve(ref.value.ref!))
        .toArray()

    // "a.x" is the only "x" in the first document, so it is closer than root "x" from another document
    expect(resolvedFqns(doc1)).toEqual(['a.x'])
    expect(resolvedFqns(doc2)).toEqual(['x'])
  })

  it('should not keep stale project scope when another document changes', async ({ t, expect }) => {
    const doc1 = await t.addDocument(`
      specification {
        element element
      }
      model {
        element a {
          #late
        }
      }
    `)
    const doc2 = await t.addDocument(`
      specification {
        tag other
      }
    `)
    const unresolved = [`Could not resolve reference to Tag named '#late'.`]

    await t.validateAll()
    expect(errorsOf(doc1)).toEqual(unresolved)

    // Tag appears in another document
    await t.edit(
      doc2,
      `
      specification {
        tag late
      }
    `,
    )
    expect(errorsOf(doc1)).toEqual([])

    // ...is renamed
    await t.edit(
      doc2,
      `
      specification {
        tag other
      }
    `,
    )
    expect(errorsOf(doc1)).toEqual(unresolved)

    // ...is back, and then the document is deleted
    await t.edit(
      doc2,
      `
      specification {
        tag late
      }
    `,
    )
    expect(errorsOf(doc1)).toEqual([])
    await t.removeDocument(doc2)
    expect(errorsOf(doc1)).toEqual(unresolved)
  })

  describe('imports', () => {
    const project1 = {
      model: `
        specification {
          element element
        }
        model {
          element lib {
            element api
          }
        }
      `,
    }

    it('should resolve imported elements in global rules and view-independent styles', async ({ expect }) => {
      await using t = await createMultiProjectTestServices({
        project1,
        project2: {
          model: `
            import lib from 'project1'
            specification {
              element element
            }
            model {
              element app
            }
            global {
              predicateGroup libs {
                include lib.*
              }
              style lib_style lib.* {
                color red
              }
              styleGroup lib_styles {
                style lib.api {
                  color green
                }
              }
            }
            views {
              style lib, lib.* {
                color red
              }
              view index {
                include *, lib
              }
            }
          `,
        },
      })
      const { errors } = await t.validateAll()
      expect(errors).toEqual([])
      expect(new Set(resolvedTypes(t.projects.project2.model, 'lib'))).toEqual(new Set(['Imported']))
    })

    it('should prefer imported element over root element from another document', async ({ expect }) => {
      await using t = await createMultiProjectTestServices({
        project1,
        project2: {
          // Import is declared in this document, so it is closer
          // than the element from another document of the project
          withImport: `
            import lib from 'project1'
            model {
              element app {
                -> lib
              }
            }
          `,
          // Same name, but without import - resolves to the element of the project
          withoutImport: `
            model {
              element app2 {
                -> lib
              }
            }
          `,
          declaration: `
            specification {
              element element
            }
            model {
              element lib
            }
          `,
        },
      })
      const { errors } = await t.validateAll()
      expect(errors).toEqual([])
      expect(resolvedTypes(t.projects.project2.withImport, 'lib')).toEqual(['Imported'])
      expect(resolvedTypes(t.projects.project2.withoutImport, 'lib')).toEqual(['Element'])
    })
  })
})
