import { ProjectId } from '@likec4/core'
import { DocumentState, URI } from 'langium'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { platform } from 'node:process'
import { describe, it, vi } from 'vitest'
import { FileChangeType } from 'vscode-languageserver'
import { WithFileSystem } from '../../filesystem/LikeC4FileSystem'
import { createMultiProjectTestServices, createTestServices } from '../../test'

const markdown = '# Title\n\nSome **markdown**'

/** The provider reports paths with the separators of the platform; the fixtures are written with `/` */
const asPosix = (path: string) => path.replaceAll('\\', '/')

function mockFiles(t: ReturnType<typeof createTestServices>, files: Record<string, string>) {
  const fs = t.services.shared.workspace.FileSystemProvider
  vi.spyOn(fs, 'readFile').mockImplementation(async (uri: URI) => files[asPosix(uri.fsPath)] ?? '')
  vi.spyOn(fs, 'readFileSync').mockImplementation(uri => {
    const content = files[asPosix(uri.fsPath)]
    if (content !== undefined) {
      return content
    }
    throw new Error(`File not found: ${asPosix(uri.fsPath)}`)
  })
}

function mockFileReadSync(files: Record<string, string>) {
  return (uri: URI) => {
    const content = files[asPosix(uri.fsPath)]
    if (content !== undefined) {
      return content
    }
    throw new Error(`File not found: ${asPosix(uri.fsPath)}`)
  }
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
          descriptionFile ./spec.md
        }
      }
    `)

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: markdown })
  })

  it('resolves a path relative to the document that uses it', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {
      '/test/workspace/src/spec.md': markdown,
      '/test/workspace/project.md': markdown,
    })

    const { document, errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component fromSubfolder {
          descriptionFile ./spec.md
        }
        component fromProjectRoot {
          descriptionFile ../project.md
        }
      }
    `)

    expect(errors).toEqual([])
    // The parsed entities hold the reference to their file until the model is built
    expect(document.c4Elements?.map(el => el.descriptionFile)).toEqual([
      { value: './spec.md', uri: 'file:///test/workspace/src/spec.md' },
      { value: '../project.md', uri: 'file:///test/workspace/project.md' },
    ])
  })

  it('does not read a referenced file while documents are parsed', async ({ expect }) => {
    const t = createTestServices()
    const readFile = vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFileSync')
      .mockReturnValueOnce(markdown)

    await t.parse(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./spec.md
        }
      }
    `)

    // Only parsed: the file is read when the model is built, and the description is resolved then
    expect(readFile).not.toHaveBeenCalled()

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: markdown })
    readFile.mockRestore()
  })

  it('keeps a value that names another scheme as an unresolved reference', async ({ expect }) => {
    const t = createTestServices()

    // parsed without validation: the resolution happens while parsing, and the file is the one thing
    // that is not part of the project
    const document = await t.parse(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile https://example.com/spec.md
        }
      }
    `)

    expect(document.c4Elements?.[0]?.descriptionFile).toEqual({
      value: 'https://example.com/spec.md',
      uri: null,
    })
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
          descriptionFile ./spec.md
        }
      }
      views {
        view v {
          descriptionFile ./spec.md
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
          descriptionFile ./missing.md
        }
      }
    `)

    // Only the message of the error, without its stack
    expect(errors).toEqual(['File not found: /test/workspace/src/missing.md'])
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
          description "fallback"
          descriptionFile ./empty.md
        }
      }
    `)

    expect(errors).toEqual(['File "./empty.md" is empty'])
    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { txt: 'fallback' })
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
          descriptionFile ./spec.md
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
          descriptionFile ./blank.md
        }
      }
    `)

    expect(errors).toEqual(['File "./blank.md" is empty'])
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
          descriptionFile ./design#v2.md
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
          descriptionFile ./..%2f..%2fsecret.txt
        }
      }
    `)

    expect(errors).toEqual(['File not found: /test/workspace/src/..%2f..%2fsecret.txt'])
  })

  it('re-reads a referenced file when it changes on disk', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
    const fs = t.services.shared.workspace.FileSystemProvider
    vi.spyOn(fs, 'readFileSync').mockImplementation(mockFileReadSync(files))
    const descriptionFiles = t.services.likec4.DescriptionFiles

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./spec.md
        }
      }
    `)

    // Files are read when the model is built
    const uri = URI.file('/test/workspace/src/spec.md')
    expect(descriptionFiles.isReferenced(uri)).toBe(true)
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# first' })

    const updated: string[] = []
    const subscription = descriptionFiles.onDescriptionFileUpdate(({ projectId }) => updated.push(projectId))

    files[asPosix(uri.fsPath)] = '# second'
    t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [{ uri: uri.toString(), type: FileChangeType.Changed }],
    })

    await vi.waitFor(() => {
      expect(updated).toHaveLength(1)
    })
    // The model is rebuilt with the new content (not taken from the cache)
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# second' })
    subscription.dispose()
  })

  it('validates the documents again when a referenced file is deleted', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
    const fs = t.services.shared.workspace.FileSystemProvider
    vi.spyOn(fs, 'readFileSync').mockImplementation(mockFileReadSync(files))

    const { document, errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          description 'inline'
          descriptionFile ./spec.md
        }
      }
    `)
    expect(errors).toEqual(['Only one of "description" and "descriptionFile" is allowed'])

    const uri = URI.file('/test/workspace/src/spec.md')
    delete files[asPosix(uri.fsPath)]
    t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [{ uri: uri.toString(), type: FileChangeType.Deleted }],
    })

    // The document is validated again (not only linked), and reports the file that is gone
    await vi.waitFor(() => {
      expect(document.state).toBe(DocumentState.Validated)
      expect(document.diagnostics?.map(d => d.message)).toEqual([
        'File not found: /test/workspace/src/spec.md',
      ])
    })
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { txt: 'inline' })
  })

  it('reports a path that escapes the workspace', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ../../../../etc/passwd
        }
      }
    `)

    expect(errors).toEqual(['File "../../../../etc/passwd" is outside of the workspace'])
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
          descriptionFile ../../workspace-other/spec.md
        }
      }
    `)

    expect(errors).toEqual(['File "../../workspace-other/spec.md" is outside of the workspace'])
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
          descriptionFile https://example.com/spec.md
        }
      }
    `)

    expect(errors).toEqual(['File "https://example.com/spec.md" cannot be resolved'])
  })

  it('reads a description file in a project on another scheme', async ({ expect }) => {
    // A VS Code Remote workspace is `vscode-remote://` and is read through the node provider,
    // which is the file system there, so the rule is the project's own scheme, not `file:`.
    const t = createTestServices({ workspace: 'memfs:///test/workspace' })
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./spec.md
        }
      }
    `)

    expect(errors).toEqual([])

    const { elements } = await t.buildModel()
    expect(elements['c1']).toHaveProperty('description', { md: markdown })
  })

  it('refuses a path that names the file scheme', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, {})

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile file:///etc/passwd
        }
      }
    `)

    expect(errors).toEqual(['File "file:///etc/passwd" cannot be resolved'])
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
          descriptionFile ./spec.md
        }
      }
    `)

    expect(errors).toEqual(['Only one of "description" and "descriptionFile" is allowed'])
  })

  it('reports a relation whose description is written in the header', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        a = component
        b = component
        a -> b 'title' 'inline' {
          descriptionFile ./spec.md
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

describe('descriptionFile, caches', () => {
  it('keeps the model listeners when the caches are cleared', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
    vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFileSync')
      .mockImplementation(mockFileReadSync(files))
    const descriptionFiles = t.services.likec4.DescriptionFiles
    const uri = URI.file('/test/workspace/src/spec.md')

    await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./spec.md
        }
      }
    `)
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# first' })

    const updated: string[] = []
    const subscription = descriptionFiles.onDescriptionFileUpdate(({ projectId }) => updated.push(projectId))
    // The caches are cleared while the services keep running: the documents are not parsed again,
    // and the model builder does not register its listener a second time
    t.services.shared.workspace.WorkspaceManager.forceCleanCaches()
    expect(descriptionFiles.isReferenced(uri)).toBe(false)

    // the model is built again, which refills the cache the clear emptied
    await t.buildModel()
    expect(descriptionFiles.isReferenced(uri)).toBe(true)

    files[asPosix(uri.fsPath)] = '# second'
    t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [{ uri: uri.toString(), type: FileChangeType.Changed }],
    })

    await vi.waitFor(() => {
      expect(updated).toHaveLength(1)
    })
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# second' })
    subscription.dispose()
  })

  it('forgets a file when the document stops referencing it', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = {
      '/test/workspace/src/a.md': '# a',
      '/test/workspace/src/b.md': '# b',
    }
    vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFileSync')
      .mockImplementation(mockFileReadSync(files))
    const descriptionFiles = t.services.likec4.DescriptionFiles
    const a = URI.file('/test/workspace/src/a.md')
    const b = URI.file('/test/workspace/src/b.md')
    const source = (file: string) => `
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./${file}
        }
      }
    `

    const { document } = await t.validate(source('a.md'))
    await t.buildModel()
    expect(descriptionFiles.isReferenced(a)).toBe(true)
    expect(descriptionFiles.isReferenced(b)).toBe(false)

    // The document now references another file
    await t.edit(document, source('b.md'))
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# b' })

    expect(descriptionFiles.isReferenced(a)).toBe(false)
    expect(descriptionFiles.isReferenced(b)).toBe(true)
  })
})

describe('descriptionFile in multiple projects', () => {
  const spec = `
    specification {
      element component
    }
  `

  it('rebuilds only the projects that use the changed file', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      owner: {
        'model.c4': `
          ${spec}
          model {
            component a {
              descriptionFile ./a.md
            }
          }
        `,
      },
      consumer: {
        'model.c4': `
          import { a } from 'owner'
          ${spec}
          model {
            component c
            c -> a
          }
        `,
      },
      unrelated: {
        'model.c4': `
          ${spec}
          model {
            component u
          }
        `,
      },
    })
    const files: Record<string, string> = { '/test/workspace/src/owner/a.md': '# first' }
    vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFileSync')
      .mockImplementation(mockFileReadSync(files))

    const consumerBefore = await t.buildModel('consumer')
    expect(consumerBefore.imports[ProjectId('owner')]?.[0]).toHaveProperty('description', { md: '# first' })
    const unrelatedBefore = await t.buildLikeC4Model('unrelated')

    const notified = new Set<string>()
    t.services.likec4.ModelBuilder.onModelParsed(projectId => notified.add(projectId))

    files['/test/workspace/src/owner/a.md'] = '# second'
    t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [{ uri: URI.file('/test/workspace/src/owner/a.md').toString(), type: FileChangeType.Changed }],
    })
    await vi.waitFor(() => {
      expect(notified).toEqual(new Set(['owner', 'consumer']))
    })

    const consumerAfter = await t.buildModel('consumer')
    expect(consumerAfter.imports[ProjectId('owner')]?.[0]).toHaveProperty('description', { md: '# second' })
    expect((await t.buildModel('owner')).elements['a']).toHaveProperty('description', { md: '# second' })
    // Not affected project is taken from the cache
    expect(await t.buildLikeC4Model('unrelated')).toBe(unrelatedBefore)
  })

  it('keeps following the files of a project when another project is updated', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      owner: {
        'model.c4': `
          ${spec}
          model {
            component a {
              descriptionFile ./a.md
            }
          }
        `,
      },
      // No documents: a project is built again from the file system, and there is none here
      another: {},
    })
    const files: Record<string, string> = { '/test/workspace/src/owner/a.md': '# first' }
    vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFileSync')
      .mockImplementation(mockFileReadSync(files))
    const descriptionFiles = t.services.likec4.DescriptionFiles
    const uri = URI.file('/test/workspace/src/owner/a.md')

    const ownerBefore = await t.buildLikeC4Model('owner')
    expect(ownerBefore.$data.elements['a']).toHaveProperty('description', { md: '# first' })

    // The config of another project changes. Only its documents are built again:
    // the documents of `owner` are not parsed again, and its model stays cached
    await t.services.shared.workspace.ProjectsManager.registerProject({
      config: { name: 'another', title: 'Another project' },
      folderUri: URI.parse('file:///test/workspace/src/another'),
    })
    expect(await t.buildLikeC4Model('owner')).toBe(ownerBefore)
    expect(descriptionFiles.isReferenced(uri)).toBe(true)

    const notified = new Set<string>()
    t.services.likec4.ModelBuilder.onModelParsed(projectId => notified.add(projectId))

    files['/test/workspace/src/owner/a.md'] = '# second'
    t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [{ uri: uri.toString(), type: FileChangeType.Changed }],
    })
    await vi.waitFor(() => {
      expect(notified).toContain('owner')
    })
    expect((await t.buildModel('owner')).elements['a']).toHaveProperty('description', { md: '# second' })
  })
})

describe('descriptionFile, path syntax', () => {
  it('takes a semicolon written next to the path as part of it', async ({ expect }) => {
    const t = createTestServices()
    mockFiles(t, { '/test/workspace/src/spec.md': markdown })

    // The `Uri` terminal matches `./spec.md;` as one path, so the formatter keeps a space before the
    // semicolon: this is the reason `LikeC4Formatter` does not glue it (see the formatter snapshot).
    const { errors } = await t.validate(`
      specification {
        element component
      }
      model {
        component c1 {
          descriptionFile ./spec.md;
        }
      }
    `)

    expect(errors).toEqual(['File not found: /test/workspace/src/spec.md;'])
  })
})
