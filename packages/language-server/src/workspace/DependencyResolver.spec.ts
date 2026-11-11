import type { ProjectId } from '@likec4/core'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../test'
import { type ExternalProject, externalProjectId } from './ExternalProjects'
import { type NormalizedUri, ProjectFolder } from './ProjectsManager'

function externalProject(key: string, folder: string): ExternalProject {
  return {
    id: externalProjectId(key),
    folder: ProjectFolder(folder),
    folderUri: URI.parse(ProjectFolder(folder)),
    configUri: URI.parse(`${ProjectFolder(folder)}likec4.config.json`),
    config: { name: key },
    includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 },
    files: new Map([[`${ProjectFolder(folder)}model.c4` as NormalizedUri, 'model {}']]),
  }
}

async function workspace(projects: Record<string, { name: string; dependencies?: Record<string, string> }>) {
  const t = await createMultiProjectTestServices({})
  for (const [folder, { name, dependencies }] of Object.entries(projects)) {
    await t.projectsManager.registerProject({
      config: {
        name,
        ...(dependencies && { dependencies }),
      },
      folderUri: folder.startsWith('file:') ? URI.parse(folder) : URI.parse(`file:///test/workspace/src/${folder}`),
    })
  }
  return t
}

const consumer = 'consumer' as ProjectId

describe('DependencyResolver', () => {
  it('resolves workspace project by name without dependencies entry', async ({ expect }) => {
    await using t = await workspace({
      shared: { name: 'shared' },
      consumer: { name: 'consumer' },
    })
    const resolver = t.services.shared.workspace.DependencyResolver
    expect(resolver.resolveWithMeta(consumer, 'shared')).toEqual({
      dependency: { kind: 'workspace', projectId: 'shared' },
      meta: { name: 'shared', source: { kind: 'workspace', projectId: 'shared' } },
    })
    expect(resolver.resolve(consumer, 'unknown')).toBeUndefined()
    // self-import is resolved, callers report it
    expect(resolver.resolve(consumer, 'consumer')).toEqual({ kind: 'workspace', projectId: 'consumer' })
  })

  it('resolves dependencies entry to the workspace project in the folder', async ({ expect }) => {
    await using t = await workspace({
      'shared-folder': { name: 'shared' },
      'billing': { name: 'billing' },
      'consumer': { name: 'consumer', dependencies: { billing: '../shared-folder', self: '../consumer' } },
    })
    const resolver = t.services.shared.workspace.DependencyResolver
    // entry wins over workspace project "billing"
    expect(resolver.resolveWithMeta(consumer, 'billing')).toEqual({
      dependency: { kind: 'workspace', projectId: 'shared' },
      meta: { name: 'shared', source: { kind: 'workspace', projectId: 'shared' } },
    })
    // without entry, workspace project by name
    expect(resolver.resolve(consumer, 'shared')).toEqual({ kind: 'workspace', projectId: 'shared' })
    expect(resolver.resolve(consumer, 'self')).toEqual({ kind: 'workspace', projectId: 'consumer' })
    // entries are resolved in the context of the consumer only
    expect(resolver.resolve('billing' as ProjectId, 'billing')).toEqual({ kind: 'workspace', projectId: 'billing' })
  })

  it('does not fall back to workspace search when entry points to unknown folder', async ({ expect }) => {
    await using t = await workspace({
      shared: { name: 'shared' },
      consumer: { name: 'consumer', dependencies: { shared: '../missing' } },
    })
    const resolver = t.services.shared.workspace.DependencyResolver
    expect(resolver.resolve(consumer, 'shared')).toBeUndefined()
  })

  it('matches folders regardless of drive letter casing', async ({ expect }) => {
    await using t = await workspace({
      'file:///c:/ws/shared': { name: 'shared' },
      'file:///C:/ws/consumer': { name: 'consumer', dependencies: { billing: '../shared' } },
    })
    const resolver = t.services.shared.workspace.DependencyResolver
    expect(resolver.resolve(consumer, 'billing')).toEqual({ kind: 'workspace', projectId: 'shared' })
  })

  it('resolves dependencies entry to the external project loaded from the folder', async ({ expect }) => {
    await using t = await workspace({
      consumer: { name: 'consumer', dependencies: { billing: '../../../deps/shared-model' } },
    })
    const external = externalProject('shared', 'file:///test/deps/shared-model')
    t.services.shared.workspace.ExternalProjects.register(external)

    const resolver = t.services.shared.workspace.DependencyResolver
    expect(resolver.resolveWithMeta(consumer, 'billing')).toEqual({
      dependency: { kind: 'external', projectId: '#shared' },
      meta: { name: 'shared', source: { kind: 'local', path: '../../../deps/shared-model' } },
    })
    // external projects are not resolved by name
    expect(resolver.resolve(consumer, 'shared')).toBeUndefined()
    expect(resolver.resolve(consumer, '#shared')).toBeUndefined()

    t.services.shared.workspace.ExternalProjects.unregister(external.id)
    expect(resolver.resolve(consumer, 'billing')).toBeUndefined()
  })

  it('resolves by name when the consumer project is unknown', async ({ expect }) => {
    await using t = await workspace({
      shared: { name: 'shared' },
    })
    const resolver = t.services.shared.workspace.DependencyResolver
    // getProject throws for unknown ids
    expect(() => t.services.shared.workspace.ProjectsLookup.getProject('unknown' as ProjectId)).toThrow()
    expect(resolver.resolve('unknown' as ProjectId, 'shared')).toEqual({ kind: 'workspace', projectId: 'shared' })
    expect(resolver.resolve('unknown' as ProjectId, 'billing')).toBeUndefined()
  })
})
