import type { ProjectId } from '@likec4/core/types'

import { useStore } from '@nanostores/react'
import { limitFunction } from 'p-limit'
import { use } from 'react'

import { batch, batched, computed, map, onMount } from 'nanostores'
import { isDeepEqual, isShallowEqual, once } from 'remeda'
import {
  type SearchElement,
  type SearchView,
  type WorkspaceIndex,
  createWorkspaceIndex,
  indexModel,
} from './search-index'

export interface WorkspaceIndexState {
  readonly index: WorkspaceIndex
  readonly loaded: number
  readonly total: number
  readonly failed: ReadonlyArray<ProjectId>
}

const loadIndex = once(async () => {
  const { loadModel } = await import('likec4:model')
  const { $projectIds, $projects } = await import('likec4:projects')

  const $models = map<
    Record<ProjectId, {
      elements: SearchElement[]
      views: SearchView[]
    }>
  >({})
  $models.eqKey = isDeepEqual

  const disposables = [] as Array<() => void>

  const disposeAll = () => {
    for (const d of disposables) {
      d()
    }
    disposables.length = 0
  }

  const load = limitFunction(async (projects: readonly [ProjectId, ...ProjectId[]]) => {
    const results = await Promise.all(
      projects.map(async (projectId) => {
        try {
          const { $likec4model } = await loadModel(projectId)
          return () =>
            $likec4model.subscribe((model) => {
              $models.setKey(projectId, indexModel(projectId, model))
            })
        } catch (error) {
          console.error('Failed to load model for project', projectId, error)
          return null
        }
      }),
    )
    batch(() => {
      disposeAll()
      for (const subscribe of results) {
        if (subscribe) {
          disposables.push(subscribe())
        }
      }
    })
  }, { concurrency: 1 })

  const $searchProjects = computed($projects, (projects) => {
    return projects.map((project) => ({ id: project.id, title: project.title ?? project.id }))
  })
  $searchProjects.eq = isDeepEqual

  const $elementsIndex = batched([$searchProjects, $models], (searchProjects, models) => {
    const elements = []
    for (const project of searchProjects) {
      const indexed = models[project.id]
      if (!indexed) {
        continue
      }
      elements.push(...indexed.elements)
    }
    return elements
  })
  $elementsIndex.eq = isShallowEqual

  const $viewsIndex = batched([$searchProjects, $models], (searchProjects, models) => {
    const views = []
    for (const project of searchProjects) {
      const indexed = models[project.id]
      if (!indexed) {
        continue
      }
      views.push(...indexed.views)
    }
    return views
  })
  $viewsIndex.eq = isShallowEqual

  const $index = batched([$searchProjects, $elementsIndex, $viewsIndex], (searchProjects, elements, views) => {
    return createWorkspaceIndex(searchProjects, elements, views)
  })

  onMount($index, () => {
    const dispose = $projectIds.subscribe((projects) => {
      load(projects).catch(console.error)
    })
    return () => {
      dispose()
      disposeAll()
    }
  })

  return {
    $index,
  }
})

/**
 * Loads the model of every project (lazily, on first use) and indexes them for search.
 * Subscribes to the model atoms, so the index follows model updates in dev mode.
 */
export function useWorkspaceIndex(_enabled: boolean): WorkspaceIndexState {
  const { $index } = use(loadIndex())
  const index = useStore($index)
  return {
    index,
    loaded: index.projects.length,
    total: index.projects.length,
    failed: [],
  }
}
