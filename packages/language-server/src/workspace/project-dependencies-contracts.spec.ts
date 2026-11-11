import type { ProjectId } from '@likec4/core'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../test'
import { type ExternalProject, externalProjectId, isExternalProjectId } from './ExternalProjects'
import { type NormalizedUri, ProjectFolder } from './ProjectsManager'

function externalProject(key: string, folder: string, files: Record<string, string>): ExternalProject {
  const folderUri = URI.parse(ProjectFolder(folder))
  return {
    id: externalProjectId(key),
    folder: ProjectFolder(folder),
    folderUri,
    configUri: URI.parse(`${ProjectFolder(folder)}likec4.config.json`),
    config: { name: key },
    includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 },
    files: new Map(Object.entries(files).map(([uri, text]) => [uri as NormalizedUri, text])),
  }
}

describe('project dependencies contracts', () => {
  describe('external project ids', () => {
    it('prefixes external ids with "#"', ({ expect }) => {
      const id = externalProjectId('shared')
      expect(id).toBe('#shared')
      expect(isExternalProjectId(id)).toBe(true)
      expect(isExternalProjectId('shared')).toBe(false)
    })

    it('rejects empty and already prefixed keys', ({ expect }) => {
      expect(() => externalProjectId('')).toThrow()
      expect(() => externalProjectId('#shared')).toThrow()
    })
  })

  describe('ExternalProjects', () => {
    it('is empty by default', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({ a: { model: 'model {}' } })
      const external = services.shared.workspace.ExternalProjects
      expect(external.all()).toEqual([])
      expect(external.has('#shared')).toBe(false)
      expect(external.get('#shared')).toBeUndefined()
      expect(external.documents('#shared')).toEqual([])
      expect(external.ownerProjectId('file:///deps/shared/model.c4')).toBeUndefined()
    })

    it('registers and unregisters instances', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({ a: { model: 'model {}' } })
      const external = services.shared.workspace.ExternalProjects
      const docUri = 'file:///deps/shared/model.c4'
      const project = externalProject('shared', 'file:///deps/shared', { [docUri]: 'model {}' })
      let changes = 0
      external.onDidChange(() => changes++)

      external.register(project)
      expect(external.has('#shared')).toBe(true)
      expect(external.get('#shared')).toBe(project)
      expect(external.ownerProjectId(URI.parse(docUri))).toBe('#shared')
      expect(external.ownerOf(docUri)).toBe(project)
      expect(external.readFile(docUri)).toBe('model {}')
      expect(external.findByFolder('file:///deps/shared')).toBe(project)
      expect(external.documents('#shared').map(String)).toEqual([docUri])

      expect(external.unregister('#shared')).toBe(project)
      expect(external.has('#shared')).toBe(false)
      expect(external.ownerProjectId(docUri)).toBeUndefined()
      expect(changes).toBe(2)
    })
  })

  describe('ProjectsLookup', () => {
    it('answers the same as ProjectsManager', async ({ expect }) => {
      const { services, projects } = await createMultiProjectTestServices({
        a: { model: 'model {}' },
        b: { model: 'model {}' },
      })
      const lookup = services.shared.workspace.ProjectsLookup
      const manager = services.shared.workspace.ProjectsManager
      const docA = projects.a.model
      expect(lookup.ownerProjectId(docA)).toBe(manager.ownerProjectId(docA))
      expect(lookup.ownerProjectId(docA)).toBe('a')
      expect(lookup.getProject(docA)).toBe(manager.getProject(docA))
      expect(lookup.getProject('b' as ProjectId)).toBe(manager.getProject('b' as ProjectId))
      expect(lookup.isIncluded('a' as ProjectId, docA)).toBe(true)
      expect(lookup.isIncluded('b' as ProjectId, docA)).toBe(false)
      expect(lookup.isExcluded(docA)).toBe(false)
      expect(lookup.isExcluded('a' as ProjectId, docA)).toBe(manager.isExcluded('a' as ProjectId, docA))
    })
  })

  describe('DependencyResolver', () => {
    it('resolves workspace projects by name', async ({ expect }) => {
      const { services } = await createMultiProjectTestServices({
        a: { model: 'model {}' },
        b: { model: 'model {}' },
      })
      const resolver = services.shared.workspace.DependencyResolver
      expect(resolver.resolve('a' as ProjectId, 'b')).toEqual({ kind: 'workspace', projectId: 'b' })
      expect(resolver.resolve('a' as ProjectId, 'unknown')).toBeUndefined()
      expect(resolver.resolve('a' as ProjectId, '#b')).toBeUndefined()
    })
  })
})
