import type { ProjectId } from '@likec4/core/types'
import { use, useMemo } from 'react'

import { batch, computed, deepEqual, map as mapAtom, onMount, useStore } from '@likec4/vite-plugin/internal'
import { type LikeC4Model, type ReadableAtom, loadModel } from 'likec4:model'
import { $projectIds, $projects } from 'likec4:projects'
import { map } from 'remeda'
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

const loadIndex = async ($projectIds: ReadableAtom<ReadonlyArray<ProjectId>>) => {
  const $models = mapAtom<{
    [projectId: string]:
      | { status: 'loaded'; elements: SearchElement[]; views: SearchView[] }
      | { status: 'error'; elements?: never; views?: never }
  }>({})
  $models.eqKey = deepEqual

  // Model subscriptions, by project
  const modelAtoms = new Map<ProjectId, ReadableAtom<LikeC4Model.Layouted>>()
  let disposed = false

  const loadProject = async (projectId: ProjectId) => {
    if (modelAtoms.has(projectId)) {
      return
    }
    try {
      const { $likec4model } = await loadModel(projectId)
      // Index was disposed or the project was removed while loading
      if (disposed) {
        return
      }
      modelAtoms.set(
        projectId,
        $likec4model,
      )
    } catch (error) {
      console.error('Failed to load model for project', projectId, error)
    }
  }

  const syncProjects = (projectIds: ReadonlyArray<ProjectId>) => {
    return Promise.all(projectIds.map(loadProject))
  }

  const subscribeProjects = (projectIds: ReadonlyArray<ProjectId>) => {
    return projectIds.map(projectId => {
      const $model = modelAtoms.get(projectId)
      if ($model) {
        return $model.subscribe((layoutedModel) => {
          $models.setKey(projectId, {
            status: 'loaded',
            ...indexModel(projectId, layoutedModel),
          })
        })
      }
      $models.setKey(projectId, { status: 'error' })
      return () => {}
    })
  }

  const $indexData = computed([$projectIds, $models], (projectIds, models) => {
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

  onMount($indexData, () => {
    disposed = false
    const disposables = [
      ...subscribeProjects($projectIds.get()),
    ]
    const disposeAll = () => {
      for (const dispose of disposables) {
        dispose()
      }
      disposables.length = 0
    }
    // Follow added/removed projects (dev mode)
    const unlisten = $projectIds.listen((projectIds) => {
      syncProjects(projectIds).then(() => {
        if (disposed) {
          return
        }
        batch(() => {
          disposeAll()
          disposables.push(
            ...subscribeProjects(projectIds),
          )
        })
      })
    })
    return () => {
      disposed = true
      disposeAll()
      unlisten()
      // Next use starts from scratch
      _loadIndexPromise = undefined
    }
  })

  // Wait for the initial models, so the first render has the index
  await syncProjects($projectIds.get())

  return {
    $indexData,
  }
}

let _loadIndexPromise: ReturnType<typeof loadIndex> | undefined
const loadIndexPromise = ($projectIds: ReadableAtom<ReadonlyArray<ProjectId>>) =>
  _loadIndexPromise ??= loadIndex($projectIds)

/**
 * Loads the model of every project (lazily, on first use) and indexes them for search.
 * Subscribes to the model atoms, so the index follows model updates in dev mode.
 */
export function useWorkspaceIndex(): WorkspaceIndexState {
  const { $indexData } = use(loadIndexPromise($projectIds))

  const $index = useMemo(() => {
    // We need only id and title
    const $searchProjects = computed(
      $projects,
      map(p => ({
        id: p.id,
        title: p.title,
      })),
    )
    $searchProjects.eq = deepEqual

    return computed([$searchProjects, $indexData], (projects, data): WorkspaceIndexState => ({
      index: createWorkspaceIndex(
        projects,
        data.elements,
        data.views,
      ),
      loaded: data.loaded,
      total: data.total,
      failed: data.failed,
    }))
  }, [$indexData])

  return useStore($index)
}
