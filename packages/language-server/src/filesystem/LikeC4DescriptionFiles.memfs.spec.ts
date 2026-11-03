import { type ProjectId, invariant } from '@likec4/core'
import { UriUtils } from 'langium'
import { vol } from 'memfs'
import { entries } from 'remeda'
import stripIndent from 'strip-indent'
import { describe, it, vi } from 'vitest'
import { FileChangeType } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { createTestServices, mockMethod } from '../test'
import { WithFileSystem } from './LikeC4FileSystem'

let seq = 0

/**
 * Creates a workspace in memfs with the given files, and services that read it.
 */
async function testWorkspace(files: Record<string, string>) {
  const root = URI.file(`/test/workspace/descriptionFile/ws${++seq}`)
  const write = (path: string, content: string) => {
    const uri = UriUtils.joinPath(root, path)
    vol.mkdirSync(UriUtils.dirname(uri).fsPath, { recursive: true })
    vol.writeFileSync(uri.fsPath, stripIndent(content).trim(), { encoding: 'utf-8' })
    return uri
  }
  const documents = entries(files)
    .map(([path, content]) => write(path, content))
    .filter(uri => uri.path.endsWith('.c4'))

  const t = createTestServices({
    workspace: root.toString(),
    context: {
      ...WithFileSystem(),
    },
  })
  // Tests share modules (`isolate: false`), so `node:fs` is not mocked:
  // the file system provider is redirected to memfs instead
  const fs = t.services.shared.workspace.FileSystemProvider
  mockMethod(fs, 'readDirectory').mockResolvedValue(
    documents.map(uri => ({ isDirectory: false, isFile: true, uri })),
  )
  mockMethod(fs, 'readFile').mockImplementation(async uri =>
    vol.existsSync(uri.fsPath) ? vol.readFileSync(uri.fsPath, 'utf-8').toString() : ''
  )
  // used by the containment check of description files
  mockMethod(fs, 'realpath').mockImplementation(async uri =>
    vol.existsSync(uri.fsPath) ? vol.realpathSync(uri.fsPath).toString() : undefined
  )
  await t.initialize()

  const modelBuilder = t.services.likec4.ModelBuilder

  return {
    services: t.services,
    /**
     * Parsed model data of the default project
     */
    async model() {
      const model = await modelBuilder.parseModel()
      invariant(model, 'model is not built')
      return model.$data
    },
    /**
     * Changes the file and notifies the language server (as the editor would)
     */
    async change(path: string, content: string) {
      const notified = new Set<ProjectId>()
      const subscription = modelBuilder.onModelParsed(projectId => notified.add(projectId))
      const uri = write(path, content)
      t.services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
        changes: [{ uri: uri.toString(), type: FileChangeType.Changed }],
      })
      await vi.waitFor(() => {
        if (notified.size === 0) {
          throw new Error('model was not rebuilt')
        }
      })
      subscription.dispose()
    },
    [Symbol.asyncDispose]: t[Symbol.asyncDispose],
  }
}

const md = (text: string) => ({ md: stripIndent(text).trim() })

describe('descriptionFile (memfs)', () => {
  it('is used for elements and relations', async ({ expect }) => {
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
        }
        model {
          a = component {
            descriptionFile ./docs/a.md
          }
          b = component
          a -> b 'calls' {
            descriptionFile ./docs/a-b.md
          }
        }
      `,
      'docs/a.md': '# Element A',
      'docs/a-b.md': '# A calls B',
    })
    const { elements, relations } = await t.model()

    expect(elements['a']).toHaveProperty('description', md('# Element A'))
    expect(elements['b']).not.toHaveProperty('description')
    const [relation] = Object.values(relations)
    expect(relation).toHaveProperty('description', md('# A calls B'))
  })

  it('is used for element and relationship kinds, and inherited by the model', async ({ expect }) => {
    await using t = await testWorkspace({
      'spec.c4': `
        specification {
          element component {
            descriptionFile ./docs/component.md
          }
          relationship async {
            descriptionFile ./docs/async.md
          }
        }
      `,
      'model.c4': `
        model {
          a = component
          b = component {
            descriptionFile ./docs/b.md
          }
          a -[async]-> b
        }
      `,
      'docs/component.md': '# Component kind',
      'docs/async.md': '# Async relationship',
      'docs/b.md': '# Element B',
    })
    const { elements, relations, specification } = await t.model()

    expect(specification.elements['component']).toHaveProperty('description', md('# Component kind'))
    expect(specification.relationships['async']).toHaveProperty('description', md('# Async relationship'))
    // inherited from the kind
    expect(elements['a']).toHaveProperty('description', md('# Component kind'))
    // own file wins over the kind
    expect(elements['b']).toHaveProperty('description', md('# Element B'))
    const [relation] = Object.values(relations)
    expect(relation).toHaveProperty('description', md('# Async relationship'))
  })

  it('is used for deployment nodes, instances and relations', async ({ expect }) => {
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
          deploymentNode node {
            descriptionFile ./docs/node-kind.md
          }
        }
        model {
          api = component
          db = component
        }
        deployment {
          node prod {
            descriptionFile ./docs/prod.md
            api = instanceOf api {
              descriptionFile ./docs/api-instance.md
            }
            db = instanceOf db
          }
          node staging
          prod.api -> prod.db {
            descriptionFile ./docs/deployment-relation.md
          }
        }
      `,
      'docs/node-kind.md': '# Node kind',
      'docs/prod.md': '# Production',
      'docs/api-instance.md': '# API instance',
      'docs/deployment-relation.md': '# API uses DB',
    })
    const { deployments } = await t.model()

    expect(deployments.elements['prod']).toHaveProperty('description', md('# Production'))
    // inherited from the kind
    expect(deployments.elements['staging']).toHaveProperty('description', md('# Node kind'))
    expect(deployments.elements['prod.api']).toHaveProperty('description', md('# API instance'))
    expect(deployments.elements['prod.db']).not.toHaveProperty('description')
    const [relation] = Object.values(deployments.relations)
    expect(relation).toHaveProperty('description', md('# API uses DB'))
  })

  it('is used for element, dynamic and deployment views', async ({ expect }) => {
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
          deploymentNode node
        }
        model {
          a = component
          b = component
          a -> b
        }
        deployment {
          node prod
        }
        views {
          view index {
            descriptionFile ./docs/index.md
            include *
          }
          dynamic view flow {
            descriptionFile ./docs/flow.md
            a -> b
          }
          deployment view deployed {
            descriptionFile ./docs/deployed.md
            include *
          }
          view plain {
            include *
          }
        }
      `,
      'docs/index.md': '# Landscape',
      'docs/flow.md': '# Flow',
      'docs/deployed.md': '# Deployed',
    })
    const { views } = await t.model()

    expect(views['index']).toHaveProperty('description', md('# Landscape'))
    expect(views['flow']).toHaveProperty('description', md('# Flow'))
    expect(views['deployed']).toHaveProperty('description', md('# Deployed'))
    expect(views['plain']).toHaveProperty('description', null)
  })

  it('resolves the path relative to the document that references it', async ({ expect }) => {
    await using t = await testWorkspace({
      'spec.c4': `
        specification {
          element component
        }
      `,
      'nested/deep/model.c4': `
        model {
          a = component {
            descriptionFile ../../docs/a.md
          }
          b = component {
            descriptionFile ./b.md
          }
        }
      `,
      'docs/a.md': '# A',
      'nested/deep/b.md': '# B',
    })
    const { elements } = await t.model()

    expect(elements['a']).toHaveProperty('description', md('# A'))
    expect(elements['b']).toHaveProperty('description', md('# B'))
  })

  it('does not read a file outside of the workspace', async ({ expect }) => {
    vol.mkdirSync('/test/outside', { recursive: true })
    vol.writeFileSync('/test/outside/secret.md', '# Secret')
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
        }
        model {
          a = component {
            descriptionFile ../../../outside/secret.md
          }
        }
      `,
    })
    const { elements } = await t.model()

    expect(elements['a']).not.toHaveProperty('description')
  })

  it('updates the model when a referenced file changes', async ({ expect }) => {
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
        }
        model {
          a = component {
            descriptionFile ./docs/a.md
          }
          b = component
          a -> b {
            descriptionFile ./docs/a-b.md
          }
        }
        views {
          view index {
            descriptionFile ./docs/index.md
            include *
          }
        }
      `,
      'docs/a.md': '# Before',
      'docs/a-b.md': '# Relation before',
      'docs/index.md': '# View before',
    })
    const before = await t.model()
    expect(before.elements['a']).toHaveProperty('description', md('# Before'))

    await t.change('docs/a.md', '# After')
    await t.change('docs/a-b.md', '# Relation after')
    await t.change('docs/index.md', '# View after')

    const after = await t.model()
    expect(after.elements['a']).toHaveProperty('description', md('# After'))
    expect(Object.values(after.relations)[0]).toHaveProperty('description', md('# Relation after'))
    expect(after.views['index']).toHaveProperty('description', md('# View after'))
  })

  it('uses the content once the referenced file is created', async ({ expect }) => {
    await using t = await testWorkspace({
      'model.c4': `
        specification {
          element component
        }
        model {
          a = component {
            descriptionFile ./docs/a.md
          }
        }
      `,
    })
    expect((await t.model()).elements['a']).not.toHaveProperty('description')

    await t.change('docs/a.md', '# Created later')

    expect((await t.model()).elements['a']).toHaveProperty('description', md('# Created later'))
  })
})
