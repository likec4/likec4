import type { ProjectId } from '@likec4/core/types'

import { useStore } from '@nanostores/react'
import { limitFunction } from 'p-limit'
import { use } from 'react'

import { deepEqual } from 'fast-equals'
import { batch, batched, computed, map as mapAtom, onMount } from 'nanostores'
import { map, once, pick } from 'remeda'
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

  const $models = mapAtom<{
    [projectId: string]:
      | { status: 'loaded'; elements: SearchElement[]; views: SearchView[] }
      | { status: 'error'; elements?: never; views?: never }
  }>({})
  $models.eqKey = deepEqual

  const disposables = [] as Array<() => void>

  const disposeAll = () => {
    for (const d of disposables) {
      d()
    }
    disposables.length = 0
  }

  const load = limitFunction(async (projects: readonly [ProjectId, ...ProjectId[]]) => {
    batch(() => {
      disposeAll()
    })
    await Promise.all(
      projects.map(async (projectId) => {
        try {
          const { $likec4model } = await loadModel(projectId)
          disposables.push(
            // Subscribe to model changes
            $likec4model.subscribe((model) => {
              $models.setKey(projectId, {
                status: 'loaded',
                ...indexModel(projectId, model),
              })
            }),
            // cleanup function
            () => $models.setKey(projectId, undefined),
          )
        } catch (error) {
          console.error('Failed to load model for project', projectId, error)
          $models.setKey(projectId, { status: 'error' })
        }
      }),
    )
  }, { concurrency: 1 })

  const $indexData = batched([$projectIds, $models], (projectIds, models) => {
    const elements = [] as SearchElement[]
    const views = [] as SearchView[]
    let loaded = 0
    let failed = [] as ProjectId[]
    for (const projectId of projectIds) {
      const indexed = models[projectId]
      if (!indexed) {
        continue
      }
      if (indexed.status === 'error') {
        failed.push(projectId)
        continue
      }
      loaded++
      elements.push(...indexed.elements)
      views.push(...indexed.views)
    }
    return {
      loaded,
      total: projectIds.length,
      failed,
      elements,
      views,
    }
  })

  const $index = computed([$projects, $indexData], (projects, data): WorkspaceIndexState => ({
    index: createWorkspaceIndex(
      map(projects, pick(['id', 'title'])),
      data.elements,
      data.views,
    ),
    loaded: data.loaded,
    total: data.total,
    failed: data.failed,
  }))

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
export function useWorkspaceIndex(): WorkspaceIndexState {
  const { $index } = use(loadIndex())
  return useStore($index)
}
