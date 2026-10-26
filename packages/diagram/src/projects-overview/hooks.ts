import { useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import type { ProjectsOverviewXYStoreApi } from './_types'
import type { ProjectsOverviewSnapshot } from './actor'
import { useProjectsOverviewActor } from './context'

export function useProjectsOverviewState<T>(
  selector: (state: ProjectsOverviewSnapshot) => T,
  compare: (a: T, b: T) => boolean = shallowEqual,
) {
  const actor = useProjectsOverviewActor()
  return useSelector(actor, selector, compare)
}

export function useProjectsOverviewXYStoreApi(): ProjectsOverviewXYStoreApi {
  return useStoreApi() as ProjectsOverviewXYStoreApi
}
