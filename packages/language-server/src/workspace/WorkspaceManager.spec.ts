// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { LikeC4ProjectConfigOps } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { describe } from 'vitest'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode } from '../filesystem'
import { mockMethod, test as it } from '../test'

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

  describe('isInsideWorkspace', () => {
    it('accepts the workspace folder and everything below it', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/model.c4'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/project/docs/spec.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/'))).toBe(true)
      // The URI can be given as a string
      expect(workspace.isInsideWorkspace('file:///test/workspace/project/docs/spec.md')).toBe(true)
    })

    it('rejects a path outside of the workspace folder', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      // parent, and a folder next to the workspace
      expect(workspace.isInsideWorkspace(URI.parse('file:///test'))).toBe(false)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/other/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace(URI.parse('file:///etc/passwd'))).toBe(false)
      // a folder whose name only starts with the name of the workspace
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace-other/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace('file:///test/other/spec.md')).toBe(false)
    })

    it('rejects another scheme', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      expect(workspace.isInsideWorkspace(URI.parse('https://example.com/test/workspace/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace(URI.parse('vscode-vfs://github/test/workspace/spec.md'))).toBe(false)
    })

    it('accepts a name inside the workspace that starts with dots', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/..notes.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/..docs/spec.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/.hidden/spec.md'))).toBe(true)
    })

    it('resolves `..` segments before the check', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      // leaves the workspace
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/../other/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/project/../../other/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace('file:///test/workspace/project/../../../etc/passwd')).toBe(false)
      // stays inside, or comes back
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/project/../shared/spec.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///test/workspace/../workspace/spec.md'))).toBe(true)
    })

    it('compares the drive letter without its case, and rejects another drive', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///c%3A/test/workspace' })
      await t.initialize()
      const workspace = t.services.shared.workspace.WorkspaceManager

      expect(workspace.isInsideWorkspace(URI.parse('file:///c%3A/test/workspace/spec.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///C%3A/test/workspace/spec.md'))).toBe(true)
      expect(workspace.isInsideWorkspace(URI.parse('file:///d%3A/test/workspace/spec.md'))).toBe(false)
      expect(workspace.isInsideWorkspace(URI.parse('file:///d%3A/other/spec.md'))).toBe(false)
    })

    it('rejects everything until the workspace is initialized', async ({ create, expect }) => {
      const t = create({ workspace: 'file:///test/workspace' })
      const workspace = t.services.shared.workspace.WorkspaceManager
      const uri = URI.parse('file:///test/workspace/model.c4')

      expect(workspace.isInsideWorkspace(uri)).toBe(false)

      await t.initialize()
      expect(workspace.isInsideWorkspace(uri)).toBe(true)
    })
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
})
