import { URI } from 'langium'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'

const markdown = '# Title\n\nSome **markdown**'

function mockFiles(t: ReturnType<typeof createTestServices>, files: Record<string, string>) {
  const fs = t.services.shared.workspace.FileSystemProvider
  vi.spyOn(fs, 'readFile').mockImplementation(async (uri: URI) => files[uri.fsPath] ?? '')
}

describe('descriptionFile', () => {
  it('uses the content of the referenced file as the description', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'spec.md'
        }
      }
    `)

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: markdown })
  })

  it('uses the content of the referenced file on a view and on a relation', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    await t.validate(`
      specification {
        element component
      }
      model {
        component a
        component b
        a -> b {
          descriptionFile 'spec.md'
        }
      }
      views {
        view v {
          descriptionFile 'spec.md'
        }
      }
    `)

    const model = await t.buildLikeC4Model()
    expect(model.view('v')?.description?.md).toBe(markdown)
    const relation = Object.values(model.$data.relations)[0]
    expect(relation?.description?.md).toBe(markdown)
  })

  it('reports a file that cannot be read', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'missing.md'
        }
      }
    `)

    expect(errors).toEqual(['File "missing.md" does not exist or cannot be read'])
  })

  it('reports an empty file', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/empty.md': '' })

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'empty.md'
        }
      }
    `)

    expect(errors).toEqual(['File "empty.md" does not exist or cannot be read'])
  })

  it('uses the content of the file as it is', async ({ expect }) => {
    const t = createTestServices()
    const content = '    # indented title\n    body line\n'
    mockFiles(t, { '/test/workspace/src/spec.md': content })

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'spec.md'
        }
      }
    `)

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: content })
  })

  it('reports a file with no content', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/blank.md': '\n  \n' })

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'blank.md'
        }
      }
    `)

    expect(errors).toEqual(['File "blank.md" does not exist or cannot be read'])
  })

  it('treats a reserved character as part of the file name', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/design#v2.md': markdown })

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'design#v2.md'
        }
      }
    `)

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: markdown })
  })

  it('does not treat an encoded separator as a separator', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile '..%2f..%2fsecret.txt'
        }
      }
    `)

    expect(errors).toEqual(['File "..%2f..%2fsecret.txt" does not exist or cannot be read'])
  })

  it('re-reads a referenced file when it changes on disk', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
    const fs = t.services.shared.workspace.FileSystemProvider
    vi.spyOn(fs, 'readFile').mockImplementation(async (uri: URI) => files[uri.fsPath] ?? '')
    const descriptionFiles = t.services.shared.workspace.DescriptionFiles

    const doc = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'spec.md'
        }
      }
    `)

    const uri = URI.parse('/test/workspace/src/spec.md')
    expect(descriptionFiles.isReferenced(uri)).toBe(true)

    const updated: string[] = []
    const subscription = descriptionFiles.onDescriptionFileUpdate(({ projectId }) => updated.push(projectId))

    files[uri.fsPath] = '# second'
    await descriptionFiles.handleFileSystemUpdate({ update: uri })

    expect(descriptionFiles.get(doc.document.uri, 'spec.md')).toEqual({ content: '# second' })
    expect(updated).toHaveLength(1)
    subscription.dispose()
  })

  it('reports a path that escapes the project', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile '../../../../etc/passwd'
        }
      }
    `)

    expect(errors).toEqual(['File "../../../../etc/passwd" is outside of the project'])
  })

  it('reports a sibling folder that shares the prefix of the project', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile '../../workspace-other/spec.md'
        }
      }
    `)

    expect(errors).toEqual(['File "../../workspace-other/spec.md" is outside of the project'])
  })

  it('reports a file of another scheme', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile 'https://example.com/spec.md'
        }
      }
    `)

    expect(errors).toEqual(['File "https://example.com/spec.md" is not part of the project'])
  })

  it('reports description and descriptionFile on the same element', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          description 'inline'
          descriptionFile 'spec.md'
        }
      }
    `)

    expect(errors).toEqual(['Only one of "description" and "descriptionFile" is allowed'])
  })

  it('keeps the description when no file is referenced', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          description 'inline'
        }
      }
    `)

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { txt: 'inline' })
  })
})
