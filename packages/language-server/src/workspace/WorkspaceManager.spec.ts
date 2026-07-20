// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { LikeC4ProjectConfigOps } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode } from '../filesystem'
import { createTestServices } from '../test'

const fileNode = (uri: URI): FileNode => ({
  isFile: true,
  isDirectory: false,
  uri,
})

describe('WorkspaceManager', () => {
  it('should load project include paths during workspace startup', async ({ expect }) => {
    const testServices = createTestServices({ workspace: 'file:///test/workspace' })
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

  it('should dedupe documents found by workspace and include-path startup scans', async ({ expect }) => {
    const testServices = createTestServices({ workspace: 'file:///test/workspace' })
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
})
