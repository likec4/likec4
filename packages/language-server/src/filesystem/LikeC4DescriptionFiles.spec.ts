import { ProjectId } from '@likec4/core'
import { URI } from 'langium'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { platform } from 'node:process'
import { describe, it, vi } from 'vitest'
import { FileChangeType } from 'vscode-languageserver'
import { createMultiProjectTestServices, createTestServices } from '../test'
import { WithFileSystem } from './LikeC4FileSystem'

const markdown = '# Title\n\nSome **markdown**'

/** The provider reports paths with the separators of the platform; the fixtures are written with `/` */
const asPosix = (path: string) => path.replaceAll('\\', '/')

function mockFiles(t: ReturnType<typeof createTestServices>, files: Record<string, string>) {
  const fs = t.services.shared.workspace.FileSystemProvider
  vi.spyOn(fs, 'readFile').mockImplementation(async (uri: URI) => files[asPosix(uri.fsPath)] ?? '')
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
      { value: './spec.md', resolvedPath: 'file:///test/workspace/src/spec.md' },
      { value: '../project.md', resolvedPath: 'file:///test/workspace/project.md' },
    ])
  })

  it('does not read a referenced file while documents are parsed', async ({ expect }) => {
    const t = createTestServices()
    const readFile = vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFile')
      .mockImplementation(async () => markdown)

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
      resolvedPath: null,
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

    expect(errors).toEqual(['File "./missing.md" does not exist or cannot be read'])
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
          descriptionFile ./empty.md
        }
      }
    `)

    expect(errors).toEqual(['File "./empty.md" does not exist or cannot be read'])
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

    expect(errors).toEqual(['File "./blank.md" does not exist or cannot be read'])
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

    expect(errors).toEqual(['File "./..%2f..%2fsecret.txt" does not exist or cannot be read'])
  })

  it('re-reads a referenced file when it changes on disk', async ({ expect }) => {
    const t = createTestServices()
    const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
    const fs = t.services.shared.workspace.FileSystemProvider
    vi.spyOn(fs, 'readFile').mockImplementation(async (uri: URI) => files[asPosix(uri.fsPath)] ?? '')
    const descriptionFiles = t.services.shared.workspace.DescriptionFiles

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
    const uri = URI.parse('/test/workspace/src/spec.md')
    expect(descriptionFiles.isReferenced(uri)).toBe(false)
    expect((await t.buildModel()).elements['c1']).toHaveProperty('description', { md: '# first' })
    expect(descriptionFiles.isReferenced(uri)).toBe(true)

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

  it('reports a path that escapes the project', async ({ expect }) => {
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
          descriptionFile ../../workspace-other/spec.md
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
          descriptionFile https://example.com/spec.md
        }
      }
    `)

    expect(errors).toEqual(['File "https://example.com/spec.md" is not part of the project'])
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

    expect(errors).toEqual(['File "file:///etc/passwd" is not part of the project'])
  })

  // A link is inside the project by name and outside it by content, so the lexical check passes and the
  // read has to follow it. Symlinks need elevated privileges on Windows, where this whole test is skipped.
  it.skipIf(platform === 'win32')(
    'follows a link inside the project, and refuses a link that leaves it',
    async ({ expect }) => {
      const root = await mkdtemp(join(tmpdir(), 'likec4-description-link-'))
      const outside = await mkdtemp(join(tmpdir(), 'likec4-description-outside-'))
      try {
        await mkdir(join(root, 'src'), { recursive: true })
        await writeFile(join(root, 'src', 'inside.md'), '# inside')
        await writeFile(join(outside, 'secret.md'), '# secret')
        await symlink(join(root, 'src', 'inside.md'), join(root, 'src', 'inside-link.md'))
        await symlink(join(outside, 'secret.md'), join(root, 'src', 'outside-link.md'))
        await symlink(outside, join(root, 'src', 'shared-dir'), 'junction')

        const t = createTestServices({
          workspace: URI.file(root).toString(),
          context: WithFileSystem(),
        })

        const { errors } = await t.validate(`
          specification {
            element component
          }
          model {
            component linked {
              descriptionFile ./inside-link.md
            }
            component escaped {
              descriptionFile ./outside-link.md
            }
            component escapedThroughDir {
              descriptionFile ./shared-dir/secret.md
            }
          }
        `)

        expect([...errors].sort()).toEqual([
          'File "./outside-link.md" is outside of the project',
          'File "./shared-dir/secret.md" is outside of the project',
        ])
        const { elements } = await t.buildModel()
        expect(elements['linked']).toHaveProperty('description', { md: '# inside' })
        expect(elements['escaped']).not.toHaveProperty('description')
        expect(elements['escapedThroughDir']).not.toHaveProperty('description')
      } finally {
        await rm(root, { recursive: true, force: true })
        await rm(outside, { recursive: true, force: true })
      }
    },
  )

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

it('registers a referenced file with the file system watcher', async ({ expect }) => {
  const t = createTestServices()
  const watch = vi
    .spyOn(t.services.shared.workspace.FileSystemWatcher, 'watch')
    .mockImplementation(() => {})
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

  // A file that was not referenced when the watcher scanned the folder is not tracked by it, so
  // its later edits would produce no events.
  expect(watch.mock.calls.flat().map(asPosix)).toContain('/test/workspace/src/spec.md')
  watch.mockRestore()
})

it('keeps the model listeners when the caches are cleared', async ({ expect }) => {
  const t = createTestServices()
  const files: Record<string, string> = { '/test/workspace/src/spec.md': '# first' }
  vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFile')
    .mockImplementation(async (uri: URI) => files[asPosix(uri.fsPath)] ?? '')
  const descriptionFiles = t.services.shared.workspace.DescriptionFiles

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

  await t.buildModel()

  const updated: string[] = []
  descriptionFiles.onDescriptionFileUpdate(({ projectId }) => updated.push(projectId))
  // `onProjectsUpdate` clears the caches while the services keep running, and the model builder
  // does not register its listener a second time
  descriptionFiles.clearCaches()

  // the model is built again, which refills the cache the clear emptied
  await t.buildModel()

  files['/test/workspace/src/spec.md'] = '# second'
  t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
    changes: [{ uri: URI.parse('/test/workspace/src/spec.md').toString(), type: FileChangeType.Changed }],
  })

  await vi.waitFor(() => {
    expect(updated).toHaveLength(1)
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
    vi.spyOn(t.services.shared.workspace.FileSystemProvider, 'readFile')
      .mockImplementation(async (uri: URI) => files[asPosix(uri.fsPath)] ?? '')

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

    expect(errors).toEqual(['File "./spec.md;" does not exist or cannot be read'])
  })
})
