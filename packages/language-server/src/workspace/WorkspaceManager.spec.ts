// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { isLikeC4Config, LikeC4ProjectConfigOps } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import JSON5 from 'json5'
import { UriUtils } from 'langium'
import { describe } from 'vitest'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode } from '../filesystem'
import { mockMethod, test as it } from '../test'
import type { createTestServices } from '../test/testServices'

const fileNode = (uri: URI): FileNode => ({
  isFile: true,
  isDirectory: false,
  uri,
})

describe('WorkspaceManager', () => {
  it('should compute relative path from workspace root', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    await t.initialize()

    const check = (s: string) =>
      expect(
        t.services.shared.workspace.WorkspaceManager.relativePath(URI.parse(s)),
      )

    check('file:///test/workspace/project/model.c4').toBe('project/model.c4')
    check('file:///test/workspace/').toBe('')
    check('file:///test/workspace/shared/model/').toBe('shared/model')
    check('file:///test/other/model.c4').toBe('../other/model.c4')
  })

  it('should load project include paths during workspace startup', async ({ create, expect }) => {
    const testServices = create({ workspace: 'file:///test/workspace' })
    try {
      const { services } = testServices
      const fs = services.shared.workspace.FileSystemProvider
      const workspaceUri = URI.parse('file:///test/workspace')
      const projectConfigUri = URI.parse('file:///test/workspace/project/.likec4rc')
      const projectDocUri = URI.parse('file:///test/workspace/project/model.c4')
      const sharedDirUri = URI.parse('file:///test/shared')
      const sharedDocUri = URI.parse('file:///test/shared/shared.c4')
      const workspaceFolder: WorkspaceFolder = {
        name: 'workspace',
        uri: workspaceUri.toString(),
      }

      mockMethod(fs, 'scanProjectFiles').mockResolvedValue([fileNode(projectConfigUri)])
      mockMethod(fs, 'loadProjectConfig').mockResolvedValue(
        LikeC4ProjectConfigOps.validate({
          name: 'projectA',
          include: { paths: ['../../shared'] },
        }),
      )
      const readDirectory = mockMethod(fs, 'readDirectory').mockImplementation(async uri => {
        switch (uri.toString()) {
          case workspaceUri.toString():
            return [fileNode(projectDocUri)]
          case sharedDirUri.toString():
            return [fileNode(sharedDocUri)]
          default:
            return []
        }
      })
      mockMethod(fs, 'readFile').mockImplementation(async uri => {
        switch (uri.toString()) {
          case projectDocUri.toString():
            return 'specification { element component }'
          case sharedDocUri.toString():
            return 'model { component shared }'
          default:
            return ''
        }
      })

      services.shared.workspace.WorkspaceManager.initialize({
        capabilities: {},
        processId: null,
        rootUri: workspaceFolder.uri,
        workspaceFolders: [workspaceFolder],
      })
      await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])

      expect(readDirectory.mock.calls.some(([uri]) => uri.toString() === sharedDirUri.toString())).toBe(true)
      expect(services.shared.workspace.LangiumDocuments.hasDocument(sharedDocUri)).toBe(true)
      expect(services.shared.workspace.ProjectsManager.ownerProjectId(sharedDocUri)).toBe('projectA')

      const projectDocs = services.shared.workspace.LangiumDocuments.projectDocuments('projectA' as ProjectId)
        .toArray()
        .map(doc => doc.uri.toString())

      expect(projectDocs).toContain(projectDocUri.toString())
      expect(projectDocs).toContain(sharedDocUri.toString())
      expect(projectDocs.filter(uri => uri === sharedDocUri.toString())).toHaveLength(1)
    } finally {
      await testServices[Symbol.asyncDispose]()
    }
  })

  it('should dedupe documents found by workspace and include-path startup scans', async ({ expect, create }) => {
    const testServices = create({ workspace: 'file:///test/workspace' })
    try {
      const { services } = testServices
      const fs = services.shared.workspace.FileSystemProvider
      const workspaceUri = URI.parse('file:///test/workspace')
      const projectConfigUri = URI.parse('file:///test/workspace/project/.likec4rc')
      const projectDocUri = URI.parse('file:///test/workspace/project/model.c4')
      const sharedDirUri = URI.parse('file:///test/workspace/shared')
      const sharedDocUri = URI.parse('file:///test/workspace/shared/shared.c4')
      const workspaceFolder: WorkspaceFolder = {
        name: 'workspace',
        uri: workspaceUri.toString(),
      }

      mockMethod(fs, 'scanProjectFiles').mockResolvedValue([fileNode(projectConfigUri)])
      mockMethod(fs, 'loadProjectConfig').mockResolvedValue(
        LikeC4ProjectConfigOps.validate({
          name: 'projectA',
          include: { paths: ['../shared'] },
        }),
      )
      const readDirectory = mockMethod(fs, 'readDirectory').mockImplementation(async uri => {
        switch (uri.toString()) {
          case workspaceUri.toString():
            return [fileNode(projectDocUri), fileNode(sharedDocUri)]
          case sharedDirUri.toString():
            return [fileNode(sharedDocUri)]
          default:
            return []
        }
      })
      mockMethod(fs, 'readFile').mockImplementation(async uri => {
        switch (uri.toString()) {
          case projectDocUri.toString():
            return 'specification { element component }'
          case sharedDocUri.toString():
            return 'model { component shared }'
          default:
            return ''
        }
      })

      services.shared.workspace.WorkspaceManager.initialize({
        capabilities: {},
        processId: null,
        rootUri: workspaceFolder.uri,
        workspaceFolders: [workspaceFolder],
      })
      await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])

      expect(readDirectory.mock.calls.some(([uri]) => uri.toString() === sharedDirUri.toString())).toBe(true)

      const allDocs = services.shared.workspace.LangiumDocuments.all.toArray().map(doc => doc.uri.toString())
      const projectDocs = services.shared.workspace.LangiumDocuments.projectDocuments('projectA' as ProjectId)
        .toArray()
        .map(doc => doc.uri.toString())

      expect(allDocs.filter(uri => uri === sharedDocUri.toString())).toHaveLength(1)
      expect(projectDocs.filter(uri => uri === sharedDocUri.toString())).toHaveLength(1)
    } finally {
      await testServices[Symbol.asyncDispose]()
    }
  })

  describe('project dependencies', () => {
    const norm = (uri: string | URI) => (URI.isUri(uri) ? uri : URI.parse(uri)).toString()

    /**
     * In-memory file system: mocks the methods of the FileSystemProvider used by the workspace startup
     */
    function mockFileSystem(t: ReturnType<typeof createTestServices>, entries: Record<string, string>) {
      const files = new Map(Object.entries(entries).map(([uri, content]) => [norm(uri), content]))
      const under = (folder: URI) => {
        const prefix = norm(folder).replace(/\/?$/, '/')
        return [...files.keys()].filter(uri => uri.startsWith(prefix)).map(uri => URI.parse(uri))
      }
      const fs = t.services.shared.workspace.FileSystemProvider
      mockMethod(fs, 'exists').mockImplementation(async uri => files.has(norm(uri)) || under(uri).length > 0)
      mockMethod(fs, 'scanProjectFiles').mockImplementation(async folder =>
        under(folder).filter(uri => isLikeC4Config(UriUtils.basename(uri))).map(fileNode)
      )
      mockMethod(fs, 'readDirectory').mockImplementation(async folder =>
        under(folder).filter(uri => /\.(c4|likec4)$/.test(uri.path)).map(fileNode)
      )
      mockMethod(fs, 'readFile').mockImplementation(async uri => files.get(norm(uri)) ?? '')
      mockMethod(fs, 'loadProjectConfig').mockImplementation(async uri => {
        const content = files.get(norm(uri))
        if (content === undefined) {
          throw new Error(`not found ${uri}`)
        }
        return LikeC4ProjectConfigOps.validate(JSON5.parse(content))
      })
    }

    it('starts, links and builds a model that imports through dependencies', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      mockFileSystem(t, {
        // consumer: imports a workspace project under another name, and a project outside the workspace
        'file:///test/workspace/consumer/likec4.config.json': JSON.stringify({
          name: 'consumer',
          dependencies: {
            billing: '../billing-service',
            shared: '../../shared-model',
          },
        }),
        'file:///test/workspace/consumer/model.c4': `
          import { invoices } from 'billing'
          import { auth } from 'shared'

          specification {
            element system
          }
          model {
            system webapp {
              -> invoices 'creates invoices'
              -> auth.tokens 'checks tokens'
            }
          }
          views {
            view index {
              include *
            }
          }
        `,
        // workspace project, its name differs from the import name
        'file:///test/workspace/billing-service/likec4.config.json': JSON.stringify({ name: 'billing-core' }),
        'file:///test/workspace/billing-service/model.c4': `
          specification {
            element service
          }
          model {
            service invoices
          }
        `,
        // project outside the workspace folder
        'file:///test/shared-model/likec4.config.json': JSON.stringify({ name: 'shared-platform' }),
        'file:///test/shared-model/model.c4': `
          specification {
            element service
          }
          model {
            service auth {
              service tokens
            }
          }
        `,
      })

      const workspaceFolder: WorkspaceFolder = { name: 'workspace', uri: 'file:///test/workspace' }
      const { WorkspaceManager, ProjectsManager, LangiumDocuments, DocumentBuilder } = t.services.shared.workspace
      WorkspaceManager.initialize({
        capabilities: {},
        processId: null,
        rootUri: workspaceFolder.uri,
        workspaceFolders: [workspaceFolder],
      })
      await WorkspaceManager.initializeWorkspace([workspaceFolder])
      await DocumentBuilder.build(LangiumDocuments.all.toArray(), { validation: true })

      // the external project is not a workspace project
      expect([...ProjectsManager.all].filter(id => id !== 'default').sort()).toEqual(['billing-core', 'consumer'])

      // the consumer is linked and valid
      const consumerDoc = LangiumDocuments.getDocument(URI.parse('file:///test/workspace/consumer/model.c4'))!
      expect(consumerDoc).toBeDefined()
      expect(consumerDoc.references.filter(ref => ref.error !== undefined).map(ref => ref.error?.message)).toEqual([])
      expect(consumerDoc.diagnostics ?? []).toEqual([])

      const model = await t.services.likec4.ModelBuilder.computeModel('consumer' as ProjectId)
      const data = model.$data

      // imports are keyed by the import names
      expect(Object.keys(data.imports).sort()).toEqual(['billing', 'shared'])
      expect(data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
      expect(data.imports['shared' as ProjectId]?.map(e => e.id).sort()).toEqual(['auth', 'auth.tokens'])
      expect(data.importedProjects).toEqual({
        billing: {
          name: 'billing-core',
          source: { kind: 'workspace', projectId: 'billing-core' },
        },
        shared: {
          name: 'shared-platform',
          source: { kind: 'local', path: '../../shared-model' },
        },
      })
      expect(model.findImportedProject('shared')).toEqual({
        name: 'shared-platform',
        source: { kind: 'local', path: '../../shared-model' },
      })

      // imported elements get the import name as prefix
      expect(model.findElement('@billing.invoices')).not.toBeNull()
      expect(model.findElement('@shared.auth.tokens')).not.toBeNull()
      const relations = [...model.relationships()].map(r => `${r.source.id} -> ${r.target.id}`).sort()
      expect(relations).toEqual([
        'webapp -> @billing.invoices',
        'webapp -> @shared.auth.tokens',
      ])

      // the view computes with the imported elements
      const view = model.view('index')
      expect(view.$view.nodes.map(n => n.id).sort()).toEqual(
        expect.arrayContaining(['webapp', '@billing.invoices']),
      )
      expect(view.$view.nodes.map(n => n.id).some(id => id.startsWith('@shared.auth'))).toBe(true)

      // internal ids of external projects do not leak into the model
      expect(JSON.stringify(data)).not.toMatch(/"#|@#/)
    })
  })
})
