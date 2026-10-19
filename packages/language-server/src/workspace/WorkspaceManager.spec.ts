// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { LikeC4ProjectConfigOps } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { describe, vi } from 'vitest'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode } from '../filesystem'
import { test as it } from '../test'

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

      vi.spyOn(fs, 'scanProjectFiles').mockResolvedValue([fileNode(projectConfigUri)])
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(
        LikeC4ProjectConfigOps.validate({
          name: 'projectA',
          include: { paths: ['../../shared'] },
        }),
      )
      const readDirectory = vi.spyOn(fs, 'readDirectory').mockImplementation(async uri => {
        switch (uri.toString()) {
          case workspaceUri.toString():
            return [fileNode(projectDocUri)]
          case sharedDirUri.toString():
            return [fileNode(sharedDocUri)]
          default:
            return []
        }
      })
      vi.spyOn(fs, 'readFile').mockImplementation(async uri => {
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

      vi.spyOn(fs, 'scanProjectFiles').mockResolvedValue([fileNode(projectConfigUri)])
      vi.spyOn(fs, 'loadProjectConfig').mockResolvedValue(
        LikeC4ProjectConfigOps.validate({
          name: 'projectA',
          include: { paths: ['../shared'] },
        }),
      )
      const readDirectory = vi.spyOn(fs, 'readDirectory').mockImplementation(async uri => {
        switch (uri.toString()) {
          case workspaceUri.toString():
            return [fileNode(projectDocUri), fileNode(sharedDocUri)]
          case sharedDirUri.toString():
            return [fileNode(sharedDocUri)]
          default:
            return []
        }
      })
      vi.spyOn(fs, 'readFile').mockImplementation(async uri => {
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

  it('should resolve extensions of elements included from another project during startup', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    try {
      const { services } = t
      const fs = services.shared.workspace.FileSystemProvider
      const configX = URI.parse('file:///test/workspace/projectx/likec4.config.json')
      const configY = URI.parse('file:///test/workspace/projecty/likec4.config.json')
      const sourceDir = URI.parse('file:///test/workspace/projecty/model')
      const sourceDoc = URI.parse('file:///test/workspace/projecty/model/model.c4')
      const extensionDoc = URI.parse('file:///test/workspace/projectx/model.c4')

      vi.spyOn(fs, 'scanProjectFiles').mockResolvedValue([fileNode(configX), fileNode(configY)])
      vi.spyOn(fs, 'loadProjectConfig').mockImplementation(async uri =>
        LikeC4ProjectConfigOps.validate(
          uri.toString() === configX.toString()
            ? { name: 'projectx', include: { paths: ['../projecty/model'] } }
            : { name: 'projecty' },
        )
      )
      vi.spyOn(fs, 'readDirectory').mockImplementation(async uri =>
        uri.toString() === sourceDir.toString()
          ? [fileNode(sourceDoc)]
          : [fileNode(sourceDoc), fileNode(extensionDoc)]
      )
      vi.spyOn(fs, 'readFile').mockImplementation(async uri =>
        uri.toString() === sourceDoc.toString()
          ? `
            specification { element app }
            model { app appx }
          `
          : `
            specification { element user element component relationship consumes }
            model {
              user appUser
              extend appx { component restAPI }
              appUser .consumes appx.restAPI
            }
          `
      )

      await t.initialize()

      const { errors } = await t.validateAll()
      expect(errors).toEqual([])
      const model = await services.likec4.ModelBuilder.computeModel('projectx' as ProjectId)
      expect(model.element('appx.restAPI').id).toBe('appx.restAPI')
      expect([...model.relationships()]).toHaveLength(1)
      expect([...model.relationships()][0]?.target.id).toBe('appx.restAPI')
      expect(services.shared.workspace.ProjectsManager.ownerProjectId(sourceDoc)).toBe('projecty')
      const docs = services.shared.workspace.LangiumDocuments.all.toArray()
      expect(docs.filter(doc => doc.uri.toString() === sourceDoc.toString())).toHaveLength(1)
    } finally {
      await t[Symbol.asyncDispose]()
    }
  })
})
