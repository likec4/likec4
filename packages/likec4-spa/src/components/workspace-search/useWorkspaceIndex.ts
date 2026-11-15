import type { LikeC4Model } from '@likec4/core/model'
import type { ProjectId } from '@likec4/core/types'
import { loadModel } from 'likec4:model'
import { useLikeC4Projects } from 'likec4:projects'
import { useEffect, useMemo, useState } from 'react'
import { type SearchProject, type WorkspaceIndex, createWorkspaceIndex, indexModel } from './search-index'

export interface WorkspaceIndexState {
  readonly index: WorkspaceIndex
  readonly loaded: number
  readonly total: number
  readonly failed: ReadonlyArray<ProjectId>
}

/**
 * Loads the model of every project (lazily, on first use) and indexes them for search.
 * Subscribes to the model atoms, so the index follows model updates in dev mode.
 */
export function useWorkspaceIndex(enabled: boolean): WorkspaceIndexState {
  const projects = useLikeC4Projects()
  const [models, setModels] = useState<ReadonlyMap<ProjectId, Readonly<LikeC4Model.Layouted>>>(() => new Map())
  const [failed, setFailed] = useState<ReadonlyArray<ProjectId>>([])

  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    const unsubscribes: Array<() => void> = []
    for (const project of projects) {
      loadModel(project.id)
        .then(({ $likec4model }) => {
          if (cancelled) {
            return
          }
          unsubscribes.push($likec4model.subscribe(model => {
            setModels(prev => new Map(prev).set(project.id, model))
          }))
        })
        .catch(error => {
          console.error(`Failed to load model of project ${project.id}`, error)
          if (!cancelled) {
            setFailed(prev => [...prev, project.id])
          }
        })
    }
    return () => {
      cancelled = true
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [enabled, projects])

  const searchProjects = useMemo(
    (): SearchProject[] => projects.map(p => ({ id: p.id, title: p.title ?? p.id })),
    [projects],
  )

  const index = useMemo(() => {
    const elements = []
    const views = []
    for (const project of searchProjects) {
      const model = models.get(project.id)
      if (!model) {
        continue
      }
      const indexed = indexModel(project.id, model)
      elements.push(...indexed.elements)
      views.push(...indexed.views)
    }
    return createWorkspaceIndex(searchProjects, elements, views)
  }, [models, searchProjects])

  return { index, loaded: models.size, total: projects.length, failed }
}
