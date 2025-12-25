import { nonNullable } from '@likec4/core'
import { createContext, useContext } from 'react'
import type { ProjectsOverviewActorRef } from './actor'

export const ProjectsOverviewActorContext = createContext<ProjectsOverviewActorRef | null>(null)

export function useProjectsOverviewActor() {
  return nonNullable(useContext(ProjectsOverviewActorContext), 'No ProjectsOverviewActorContext')
}
